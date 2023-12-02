import { Bean, Qualifier } from "./context/context";
import { AgEvent, AgGridEvent } from "./events";
import { GridOptionsService } from "./gridOptionsService";
import { IEventEmitter } from "./interfaces/iEventEmitter";
import { IFrameworkOverrides } from "./interfaces/iFrameworkOverrides";
import { LoggerFactory } from "./logger";

@Bean('eventService')
export class EventService implements IEventEmitter {

    private allSyncListeners = new Map<string, Set<Function>>();
    private allAsyncListeners = new Map<string, Set<Function>>();

    private globalSyncListeners = new Set<Function>();
    private globalAsyncListeners = new Set<Function>();

    private frameworkOverrides: IFrameworkOverrides;
    private gridOptionsService?: GridOptionsService;

    private asyncFunctionsQueue: Function[] = [];
    private scheduled = false;

    // using an object performs better than a Set for the number of different events we have
    private firedEvents: { [key: string]: boolean; } = {};

    // because this class is used both inside the context and outside the context, we do not
    // use autowired attributes, as that would be confusing, as sometimes the attributes
    // would be wired, and sometimes not.
    //
    // the global event servers used by AG Grid is autowired by the context once, and this
    // setBeans method gets called once.
    //
    // the times when this class is used outside of the context (eg RowNode has an instance of this
    // class) then it is not a bean, and this setBeans method is not called.
    public setBeans(
        @Qualifier('loggerFactory') loggerFactory: LoggerFactory,
        @Qualifier('gridOptionsService') gridOptionsService: GridOptionsService,
        @Qualifier('frameworkOverrides') frameworkOverrides: IFrameworkOverrides,
        @Qualifier('globalEventListener') globalEventListener: Function | null = null,
        @Qualifier('globalSyncEventListener') globalSyncEventListener: Function | null = null
    ) {
        this.frameworkOverrides = frameworkOverrides;
        this.gridOptionsService = gridOptionsService;

        if (globalEventListener) {
            const async = gridOptionsService.useAsyncEvents();
            this.addGlobalListener(globalEventListener, async);
        }

        if (globalSyncEventListener) {
            this.addGlobalListener(globalSyncEventListener, false);
        }
    }

    private getListeners(eventType: string, async: boolean, autoCreateListenerCollection: boolean): Set<Function> | undefined {
        const listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
        let listeners = listenerMap.get(eventType);

        // Note: 'autoCreateListenerCollection' should only be 'true' if a listener is about to be added. For instance
        // getListeners() is also called during event dispatch even though no listeners are added. This measure protects
        // against 'memory bloat' as empty collections will prevent the RowNode's event service from being removed after
        // the RowComp is destroyed, see noRegisteredListenersExist() below.
        if (!listeners && autoCreateListenerCollection) {
            listeners = new Set<Function>();
            listenerMap.set(eventType, listeners);
        }

        return listeners;
    }

    public noRegisteredListenersExist(): boolean {
        return this.allSyncListeners.size === 0 && this.allAsyncListeners.size === 0 &&
            this.globalSyncListeners.size === 0 && this.globalAsyncListeners.size === 0;
    }

    public addEventListener(eventType: string, listener: Function, async = false): void {
        this.getListeners(eventType, async, true)!.add(listener);
    }

    public removeEventListener(eventType: string, listener: Function, async = false): void {
        const listeners = this.getListeners(eventType, async, false);
        if (!listeners) { return; }

        listeners.delete(listener);

        if (listeners.size === 0) {
            const listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
            listenerMap.delete(eventType);
        }
    }

    public addGlobalListener(listener: Function, async = false): void {
        (async ? this.globalAsyncListeners : this.globalSyncListeners).add(listener);
    }

    public removeGlobalListener(listener: Function, async = false): void {
        (async ? this.globalAsyncListeners : this.globalSyncListeners).delete(listener);
    }

    public dispatchEvent(event: AgEvent): void {
        let agEvent = event as AgGridEvent<any>;
        if (this.gridOptionsService) {
            // Apply common properties to all dispatched events if this event service has had its beans set with gridOptionsService.
            // Note there are multiple instances of EventService that are used local to components which do not set gridOptionsService.
            const { api, columnApi, context } = this.gridOptionsService;
            agEvent.api = api;
            agEvent.columnApi = columnApi;
            agEvent.context = context;
        }

        this.dispatchToListeners(agEvent, true);
        this.dispatchToListeners(agEvent, false);

        this.firedEvents[agEvent.type] = true;
    }

    public dispatchEventOnce(event: AgEvent): void {
        if (!this.firedEvents[event.type]) {
            this.dispatchEvent(event);
        }
    }

    private dispatchToListeners(event: AgEvent, async: boolean) {
        const eventType = event.type;

        if (async && 'event' in event) {
            const browserEvent = (event as any).event;
            if (browserEvent instanceof Event) {
                // AG-7893 - Persist composedPath() so that its result can still be accessed by the user asynchronously.
                // Within an async event handler if they call composedPath() on the event it will always return an empty [].
                (event as any).eventPath = browserEvent.composedPath();
            }
        }

        const processEventListeners = (listeners: Set<Function>, originalListeners: Set<Function>) => listeners.forEach(listener => {
            if (!originalListeners.has(listener)) {
                // A listener could have been removed by a previously processed listener. In this case we don't want to call 
                return;
            }
            if (async) {
                this.dispatchAsync(() => listener(event));
            } else {
                listener(event);
            }
        });

        const originalListeners = this.getListeners(eventType, async, false) ?? new Set();
        // create a shallow copy to prevent listeners cyclically adding more listeners to capture this event
        const listeners = new Set(originalListeners);
        if (listeners.size > 0) {
            processEventListeners(listeners, originalListeners);
        }

        const globalListeners = new Set(async ? this.globalAsyncListeners : this.globalSyncListeners);

        globalListeners.forEach(listener => {
            if (async) {
                this.dispatchAsync(
                    () => this.frameworkOverrides.dispatchEvent(eventType, () => listener(eventType, event), true)
                );
            } else {
                this.frameworkOverrides.dispatchEvent(eventType, () => listener(eventType, event), true);
            }
        });
    }

    // this gets called inside the grid's thread, for each event that it
    // wants to set async. the grid then batches the events into one setTimeout()
    // because setTimeout() is an expensive operation. ideally we would have
    // each event in it's own setTimeout(), but we batch for performance.
    private dispatchAsync(func: Function): void {
        // add to the queue for executing later in the next VM turn
        this.asyncFunctionsQueue.push(func);

        // check if timeout is already scheduled. the first time the grid calls
        // this within it's thread turn, this should be false, so it will schedule
        // the 'flush queue' method the first time it comes here. then the flag is
        // set to 'true' so it will know it's already scheduled for subsequent calls.
        if (!this.scheduled) {
            // if not scheduled, schedule one
            window.setTimeout(this.flushAsyncQueue.bind(this), 0);
            // mark that it is scheduled
            this.scheduled = true;
        }
    }

    // this happens in the next VM turn only, and empties the queue of events
    private flushAsyncQueue(): void {
        this.scheduled = false;

        // we take a copy, because the event listener could be using
        // the grid, which would cause more events, which would be potentially
        // added to the queue, so safe to take a copy, the new events will
        // get executed in a later VM turn rather than risk updating the
        // queue as we are flushing it.
        const queueCopy = this.asyncFunctionsQueue.slice();
        this.asyncFunctionsQueue = [];

        // execute the queue
        queueCopy.forEach(func => func());
    }
}
