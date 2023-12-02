import { RowNodeBlock } from "./rowNodeBlock";
import { Autowired, Bean, PostConstruct, Qualifier } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { Logger, LoggerFactory } from "../logger";
import { IRowModel } from "../interfaces/iRowModel";
import { IServerSideRowModel } from "../interfaces/iServerSideRowModel";
import { _ } from "../utils";

@Bean('rowNodeBlockLoader')
export class RowNodeBlockLoader extends BeanStub {
    @Autowired('rowModel') private rowModel: IRowModel;
    
    public static BLOCK_LOADED_EVENT = 'blockLoaded';
    public static BLOCK_LOADER_FINISHED_EVENT = 'blockLoaderFinished';

    private maxConcurrentRequests: number | undefined;
    private checkBlockToLoadDebounce: () => void;

    private activeBlockLoadsCount = 0;
    private blocks: RowNodeBlock[] = [];
    private logger: Logger;
    private active = true;

    @PostConstruct
    private postConstruct(): void {
        this.maxConcurrentRequests = this.getMaxConcurrentDatasourceRequests();
        const blockLoadDebounceMillis = this.gridOptionsService.get('blockLoadDebounceMillis');

        if (blockLoadDebounceMillis && blockLoadDebounceMillis > 0) {
            this.checkBlockToLoadDebounce = _.debounce(this.performCheckBlocksToLoad.bind(this), blockLoadDebounceMillis);
        }
    }

    private setBeans(@Qualifier('loggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.create('RowNodeBlockLoader');
    }

    private getMaxConcurrentDatasourceRequests(): number | undefined {
        const res = this.gridOptionsService.get('maxConcurrentDatasourceRequests');
        if (res == null) { return 2; } // 2 is the default
        if (res <= 0) { return; } // negative number, eg -1, means no max restriction
        return res;
    }

    public addBlock(block: RowNodeBlock): void {
        this.blocks.push(block);

        // note that we do not remove this listener when removing the block. this is because the
        // cache can get destroyed (and containing blocks) when a block is loading. however the loading block
        // is still counted as an active loading block and we must decrement activeBlockLoadsCount when it finishes.
        block.addEventListener(RowNodeBlock.EVENT_LOAD_COMPLETE, this.loadComplete.bind(this));

        this.checkBlockToLoad();
    }

    public removeBlock(block: RowNodeBlock): void {
        _.removeFromArray(this.blocks, block);
    }

    protected destroy(): void {
        super.destroy();
        this.active = false;
    }

    public loadComplete(): void {
        this.activeBlockLoadsCount--;
        this.checkBlockToLoad();
        this.dispatchEvent({type: RowNodeBlockLoader.BLOCK_LOADED_EVENT});
        if (this.activeBlockLoadsCount == 0) {
            this.dispatchEvent({type: RowNodeBlockLoader.BLOCK_LOADER_FINISHED_EVENT});
        }
    }

    public checkBlockToLoad(): void {
        if (this.checkBlockToLoadDebounce) {
            this.checkBlockToLoadDebounce();
        } else {
            this.performCheckBlocksToLoad();
        }
    }

    private performCheckBlocksToLoad(): void {
        if (!this.active) { return; }

        this.printCacheStatus();

        if (this.maxConcurrentRequests != null && this.activeBlockLoadsCount >= this.maxConcurrentRequests) {
            this.logger.log(`checkBlockToLoad: max loads exceeded`);
            return;
        }

        const loadAvailability = this.getAvailableLoadingCount();
        const blocksToLoad: RowNodeBlock[] = this.blocks.filter(block => (
            block.getState() === RowNodeBlock.STATE_WAITING_TO_LOAD
        )).slice(0, loadAvailability);

        this.registerLoads(blocksToLoad.length);
        blocksToLoad.forEach(block => block.load());
        this.printCacheStatus();
    }

    public getBlockState() {
        if (this.gridOptionsService.isRowModelType('serverSide')) {
            const ssrm = this.rowModel as IServerSideRowModel;
            return ssrm.getBlockStates();
        }

        const result: { [key: string]: any } = {};
        this.blocks.forEach((block: RowNodeBlock) => {
            const {id, state} = block.getBlockStateJson();
            result[id] = state;
        });
        return result;
    }

    private printCacheStatus(): void {

        if (this.logger.isLogging()) {
            this.logger.log(`printCacheStatus: activePageLoadsCount = ${this.activeBlockLoadsCount},`
                + ` blocks = ${JSON.stringify(this.getBlockState())}`);
        }
    }

    public isLoading(): boolean {
        return this.activeBlockLoadsCount > 0;
    }

    public registerLoads(count: number) {
        this.activeBlockLoadsCount += count;
    }

    public getAvailableLoadingCount() {
        return this.maxConcurrentRequests !== undefined ? this.maxConcurrentRequests - this.activeBlockLoadsCount : undefined;
    }
}
