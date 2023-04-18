import { BeanStub, Autowired, GridApi, ColumnApi, RowNode, IServerSideGetRowsParams, IServerSideGetRowsRequest, _, PostConstruct, RowNodeBlockLoader, ServerSideGroupLevelParams, LoadSuccessParams } from "@ag-grid-community/core";
import { LazyCache } from "./lazyCache";

export class LazyBlockLoader extends BeanStub {

    @Autowired('gridApi') private api: GridApi;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('rowNodeBlockLoader') private rowNodeBlockLoader: RowNodeBlockLoader;

    public static DEFAULT_BLOCK_SIZE = 100;

    private loadingNodes: Set<number> = new Set();

    private readonly parentNode: RowNode;
    private readonly cache: LazyCache;

    private checkForLoadQueued: boolean = false;
    private loaderTimeout: number | undefined = undefined;
    private nextBlockToLoad: [string, number] | undefined = undefined;

    private storeParams: ServerSideGroupLevelParams;

    constructor(cache: LazyCache, parentNode: RowNode, storeParams: ServerSideGroupLevelParams) {
        super();
        this.parentNode = parentNode;
        this.cache = cache;
        this.storeParams = storeParams;
    }

    @PostConstruct
    private init() {
        this.addManagedListener(this.rowNodeBlockLoader, RowNodeBlockLoader.BLOCK_LOADED_EVENT, () => this.queueLoadAction());
    }

    public isRowLoading(index: number) {
        return this.loadingNodes.has(index);
    }

    private getBlockToLoad() {
        const firstRowInViewport = this.api.getFirstDisplayedRow();
        const lastRowInViewport = this.api.getLastDisplayedRow();

        // quick look-up for priority rows needing loading in viewport.
        for(let i = firstRowInViewport; i <= lastRowInViewport; i++) {
            const node = this.cache.getNodeCachedByDisplayIndex(i);

            if (!node) {
                // if no row details, ignore, as row hasn't been created
                // and it's too expensive to work out its location here
                continue;
            }

            const lazyNode = this.cache.getNodes().getBy('node', node);
            if (!lazyNode) {
                continue;
            }

            if(this.isRowLoading(lazyNode.index)) {
                continue;
            }

            if (node.__needsRefreshWhenVisible || (node.stub && !node.failedLoad)) {
                return this.getBlockStartIndexForIndex(lazyNode.index);
            }
        }

        const nodesToRefresh = this.cache.getNodesToRefresh();
        let nodeToRefresh: RowNode | null = null;
        let nodeToRefreshDist: number = Number.MAX_SAFE_INTEGER;
        nodesToRefresh.forEach(node => {
            if (node.rowIndex == null) {
                nodeToRefresh = node;
                return;
            }
            const distToViewportTop = Math.abs(firstRowInViewport - node.rowIndex);
            const distToViewportBottom = Math.abs(node.rowIndex - lastRowInViewport);
            if (distToViewportTop < nodeToRefreshDist) {
                nodeToRefresh = node;
                nodeToRefreshDist = distToViewportTop;
            }

            if (distToViewportBottom < nodeToRefreshDist) {
                nodeToRefresh = node;
                nodeToRefreshDist = distToViewportBottom;
            }
        });
        const lazyIndex = this.cache.getNodes().getBy('node', nodeToRefresh)?.index;
        return lazyIndex == null ? undefined : this.getBlockStartIndexForIndex(lazyIndex);
    }

    public reset() {
        this.loadingNodes.clear();
        clearTimeout(this.loaderTimeout);
        this.loaderTimeout = undefined;
    }

    private executeLoad(startRow: number, endRow: number) {
        const ssrmParams = this.cache.getSsrmParams();
        const request: IServerSideGetRowsRequest = {
            startRow,
            endRow,
            rowGroupCols: ssrmParams.rowGroupCols,
            valueCols: ssrmParams.valueCols,
            pivotCols: ssrmParams.pivotCols,
            pivotMode: ssrmParams.pivotMode,
            groupKeys: this.parentNode.getGroupKeys(),
            filterModel: ssrmParams.filterModel,
            sortModel: ssrmParams.sortModel,
        };

        const removeNodesFromLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                this.loadingNodes.delete(startRow + i);
            }
        }
        
        const addNodesToLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                this.loadingNodes.add(startRow + i);
            }
        }

        const success = (params: LoadSuccessParams) => {
            this.rowNodeBlockLoader.loadComplete();
            this.cache.onLoadSuccess(startRow, endRow - startRow, params);
            removeNodesFromLoadingMap();
            this.queueLoadAction();
        };

        const fail = () => {
            this.rowNodeBlockLoader.loadComplete();
            this.cache.onLoadFailed(startRow, endRow - startRow);
            removeNodesFromLoadingMap();
            this.queueLoadAction();
        }

        const params: IServerSideGetRowsParams = {
            request,
            successCallback: (rowData: any[], rowCount: number) => success({ rowData, rowCount }),
            success,
            failCallback: fail,
            fail,
            parentNode: this.parentNode,
            api: this.api,
            columnApi: this.columnApi,
            context: this.gridOptionsService.context
        };

        addNodesToLoadingMap();
        this.cache.getSsrmParams().datasource?.getRows(params);
    }

    private getNextBlockToLoad(): [string, number] | null {
        const result = this.getBlockToLoad();
        if (result != null && result < 0) {
            this.getBlockToLoad();
        }
        if (result != null) {
            return [String(result), result + this.getBlockSize()];
        }
        return null;
    }

    public queueLoadCheck() {
        // already going to check next cycle, ignore.
        if (this.checkForLoadQueued) {
            return;
        }
        this.checkForLoadQueued = true;
        window.queueMicrotask(() => {
            this.checkForLoadQueued = false;
            this.queueLoadAction();
        });
    }

    public queueLoadAction() {
        const nextBlockToLoad = this.getNextBlockToLoad();
        if (!nextBlockToLoad) {
            // there's no block we should be loading right now, clear the timeouts
            window.clearTimeout(this.loaderTimeout);
            this.loaderTimeout = undefined;
            this.nextBlockToLoad = undefined;
            return;
        }

        // if the next required block has changed, reset the loading timeout
        if (!this.nextBlockToLoad || (this.nextBlockToLoad[0] !== nextBlockToLoad[0] && this.nextBlockToLoad[1] !== nextBlockToLoad[1])) {
            this.nextBlockToLoad = nextBlockToLoad;
            window.clearTimeout(this.loaderTimeout);

            const [startRowString, endRow] = this.nextBlockToLoad;
            const startRow = Number(startRowString);
            this.loaderTimeout = window.setTimeout(() => {
                if (!this.cache.isAlive()) {
                    return;
                }
                this.loaderTimeout = undefined;
                this.attemptLoad(startRow, endRow);
                this.nextBlockToLoad = undefined;
            }, this.gridOptionsService.getNum('blockLoadDebounceMillis') ?? 0);
        }
    }

    private attemptLoad(start: number, end: number) {
        const availableLoadingCount = this.rowNodeBlockLoader.getAvailableLoadingCount();
        // too many loads already, ignore the request as a successful request will requeue itself anyway
        if (availableLoadingCount != null && availableLoadingCount === 0) {
            return;
        }

        this.rowNodeBlockLoader.registerLoads(1);
        this.executeLoad(start, end);

        this.queueLoadAction();
    }


    public getBlockSize() {
        return this.storeParams.cacheBlockSize || LazyBlockLoader.DEFAULT_BLOCK_SIZE;
    }

    public getBlockStartIndexForIndex(storeIndex: number): number {
        const blockSize = this.getBlockSize();
        return storeIndex - (storeIndex % blockSize);
    }

    public getBlockBoundsForIndex(storeIndex: number): [number, number] {
        const startOfBlock = this.getBlockStartIndexForIndex(storeIndex);
        const blockSize = this.getBlockSize();
        return [startOfBlock, startOfBlock + blockSize];
    }
}