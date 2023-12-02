import {
    _,
    IServerSideStore,
    Autowired,
    Bean,
    BeanStub,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    StoreRefreshAfterParams,
    RowNode,
    ColumnVO,
    RowNodeBlock,
    ColumnModel,
    GridOptions
} from "@ag-grid-community/core";
import { SSRMParams, ServerSideRowModel } from "../serverSideRowModel";
import { StoreFactory } from "./storeFactory";

@Bean('ssrmStoreUtils')
export class StoreUtils extends BeanStub {

    @Autowired('columnModel') private columnModel: ColumnModel;
    @Autowired('rowModel') private serverSideRowModel: ServerSideRowModel;
    @Autowired('ssrmStoreFactory') private storeFactory: StoreFactory;

    public loadFromDatasource(p: {
        storeParams: SSRMParams,
        parentNode: RowNode,
        parentBlock: RowNodeBlock,
        success: () => void,
        fail: () => void,
        startRow?: number,
        endRow?: number}
    ): void {
        const { storeParams, parentBlock, parentNode } = p;
        const groupKeys = parentNode.getGroupKeys();

        if (!storeParams.datasource) { return; }

        const request: IServerSideGetRowsRequest = {
            startRow: p.startRow,
            endRow: p.endRow,
            rowGroupCols: storeParams.rowGroupCols,
            valueCols: storeParams.valueCols,
            pivotCols: storeParams.pivotCols,
            pivotMode: storeParams.pivotMode,
            groupKeys: groupKeys,
            filterModel: storeParams.filterModel,
            sortModel: storeParams.sortModel
        };

        const getRowsParams: IServerSideGetRowsParams = {
            success: p.success,
            fail: p.fail,
            request: request,
            parentNode: p.parentNode,
            api: this.gridOptionsService.api,
            columnApi: this.gridOptionsService.columnApi,
            context: this.gridOptionsService.context
        };

        window.setTimeout(() => {
            if (!storeParams.datasource || !parentBlock.isAlive()) {
                // failCallback() is important, to reduce the 'RowNodeBlockLoader.activeBlockLoadsCount' count
                p.fail();
                return;
            }
            storeParams.datasource.getRows(getRowsParams);
        }, 0);
    }

    public getChildStore(keys: string[], currentCache: IServerSideStore, findNodeFunc: (key: string) => RowNode | null): IServerSideStore | null {
        if (_.missingOrEmpty(keys)) { return currentCache; }

        const nextKey = keys[0];
        const nextNode = findNodeFunc(nextKey);

        if (nextNode) {
            // if we have the final node, but not the final store, we create it to allow
            // early population of data
            if (keys.length === 1 && !nextNode.childStore) {
                const storeParams = this.serverSideRowModel.getParams();
                nextNode.childStore = this.createBean(this.storeFactory.createStore(storeParams, nextNode));
            }

            const keyListForNextLevel = keys.slice(1, keys.length);
            const nextStore = nextNode.childStore;
            return nextStore ? nextStore.getChildStore(keyListForNextLevel) : null;
        }

        return null;
    }

    public isServerRefreshNeeded(parentRowNode: RowNode, rowGroupCols: ColumnVO[], params: StoreRefreshAfterParams): boolean {
        if (params.valueColChanged || params.secondaryColChanged) {
            return true;
        }

        const level = parentRowNode.level + 1;
        const grouping = level < rowGroupCols.length;
        const leafNodes = !grouping;

        if (leafNodes) { return true; }

        const colIdThisGroup = rowGroupCols[level].id;
        const actionOnThisGroup = params.changedColumns.indexOf(colIdThisGroup) > -1;

        if (actionOnThisGroup) { return true; }

        const allCols = this.columnModel.getAllGridColumns();
        const affectedGroupCols = allCols
            // find all impacted cols which also a group display column
            .filter(col => col.getColDef().showRowGroup && params.changedColumns.includes(col.getId()))
            .map(col => col.getColDef().showRowGroup)
            // if displaying all groups, or displaying the effected col for this group, refresh
            .some(group => group === true || group === colIdThisGroup);

        return affectedGroupCols;
    }

    public getServerSideInitialRowCount(): number | null {
        return this.gridOptionsService.get('serverSideInitialRowCount');
    }

    private assertRowModelIsServerSide(key: keyof GridOptions) {
        if (!this.gridOptionsService.isRowModelType('serverSide')) {
            _.warnOnce(`The '${key}' property can only be used with the Server Side Row Model.`);
            return false;
        }
        return true;
    }
    private assertNotTreeData(key: keyof GridOptions) {
        if (this.gridOptionsService.get('treeData')) {
            _.warnOnce(`The '${key}' property cannot be used while using tree data.`);
            return false;
        }
        return true;
    }

    public isServerSideSortAllLevels() {
        return this.gridOptionsService.get('serverSideSortAllLevels') && this.assertRowModelIsServerSide('serverSideSortAllLevels');
    }
    public isServerSideOnlyRefreshFilteredGroups() {
        return this.gridOptionsService.get('serverSideOnlyRefreshFilteredGroups') && this.assertRowModelIsServerSide('serverSideOnlyRefreshFilteredGroups');
    }
    public isServerSideSortOnServer() {
        return this.gridOptionsService.get('serverSideSortOnServer') && this.assertRowModelIsServerSide('serverSideSortOnServer') && this.assertNotTreeData('serverSideSortOnServer');
    }
    public isServerSideFilterOnServer() {
        return this.gridOptionsService.get('serverSideFilterOnServer') && this.assertRowModelIsServerSide('serverSideFilterOnServer') && this.assertNotTreeData('serverSideFilterOnServer');
    }

}