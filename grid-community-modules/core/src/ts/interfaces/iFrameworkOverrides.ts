import { AgPromise } from "../utils";

export interface IFrameworkOverrides {

    /** Because Angular uses Zones, you should not use setTimeout or setInterval (as it'll keep angular constantly doing dirty checks etc
     * So to get around this, we allow the framework to specify how to execute setTimeout. The default is to just call the browser setTimeout().
     */
    setTimeout(action: any, timeout?: any): void;
    setInterval(action: any, interval?: any): AgPromise<number>;

    /** Again because Angular uses Zones, we allow adding some events outside of Zone JS so that we do not kick off
     * the Angular change detection. We do this for some events ONLY, and not all events, just events that get fired
     * a lot (eg mouse move), but we need to make sure in AG Grid that we do NOT call any grid callbacks while processing
     * these events, as we will be outside of ZoneJS and hence Angular2 Change Detection won't work. However it's fine
     * for our code to result in AG Grid events (and Angular application action on these) as these go through
     * Event Emitter's.
     *
     * This was done by Niall and Sean. The problematic events are mouseover, mouseout, mouseenter and mouseleave.
     */
    addEventListener(element: HTMLElement, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    dispatchEvent(eventType: string, listener: () => {}, global: boolean): void;

    /*
    * vue components are specified in the "components" part of the vue component - as such we need a way to deteremine if a given component is
    * within that context - this method provides this
    * Note: This is only really used/necessary with cellRendererSelectors
    */
    frameworkComponent(name: string, components?: any): any;

    /*
     * Allows framework to identify if a class is a component from that framework.
     */
    isFrameworkComponent(comp: any): boolean;

    /**
     * Which rendering engine is used for the grid components. Can be either 'vanilla' or 'react'.
     */
    renderingEngine: 'vanilla' | 'react';
    
    /**
     * Returns the framework specific url for linking to a documentation page.
     * @param path Optional path to append to the base url. i.e 'aligned-grids' Does not need the leading `/`
     */
    getDocLink(path?: string): string;
}
