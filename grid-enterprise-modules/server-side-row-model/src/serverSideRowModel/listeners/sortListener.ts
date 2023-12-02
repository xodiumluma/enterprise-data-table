import {
    _,
    Autowired,
    Bean,
    BeanStub,
    ColumnModel,
    GROUP_AUTO_COLUMN_ID,
    Events,
    PostConstruct,
    SortController,
    Column,
    SortModelItem,
    StoreRefreshAfterParams
} from "@ag-grid-community/core";
import { ServerSideRowModel } from "../serverSideRowModel";
import { ListenerUtils } from "./listenerUtils";

@Bean('ssrmSortService')
export class SortListener extends BeanStub {

    @Autowired('sortController') private sortController: SortController;
    @Autowired('rowModel') private serverSideRowModel: ServerSideRowModel;
    @Autowired('ssrmListenerUtils') private listenerUtils: ListenerUtils;

    @PostConstruct
    private postConstruct(): void {
        // only want to be active if SSRM active, otherwise would be interfering with other row models
        if (!this.gridOptionsService.isRowModelType('serverSide')) { return; }

        this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, this.onSortChanged.bind(this));
    }

    private onSortChanged(): void {
        const storeParams = this.serverSideRowModel.getParams();
        if (!storeParams) { return; } // params is undefined if no datasource set

        const newSortModel = this.sortController.getSortModel();
        const oldSortModel = storeParams.sortModel;

        const changedColumns = this.findChangedColumnsInSort(newSortModel, oldSortModel);
        const valueColChanged = this.listenerUtils.isSortingWithValueColumn(changedColumns);
        const secondaryColChanged = this.listenerUtils.isSortingWithSecondaryColumn(changedColumns);

        const params: StoreRefreshAfterParams = {
            valueColChanged,
            secondaryColChanged,
            changedColumns
        };

        this.serverSideRowModel.refreshAfterSort(newSortModel, params);
    }

    // returns back all the cols that were effected by the sorting. eg if we were sorting by col A,
    // and now we are sorting by col B, the list of impacted cols should be A and B. so if a cache
    // is impacted by sorting on A or B then it needs to be refreshed. this includes where the cache
    // was previously sorted by A and then the A sort now needs to be cleared.
    private findChangedColumnsInSort(
        newSortModel: SortModelItem[],
        oldSortModel: SortModelItem[]): string[] {

        let allColsInBothSorts: string[] = [];

        [newSortModel, oldSortModel].forEach(sortModel => {
            if (sortModel) {
                const ids = sortModel.map(sm => sm.colId);
                allColsInBothSorts = allColsInBothSorts.concat(ids);
            }
        });

        const differentSorts = (oldSortItem: SortModelItem | undefined, newSortItem: SortModelItem | undefined) => {
            const oldSort = oldSortItem ? oldSortItem.sort : null;
            const newSort = newSortItem ? newSortItem.sort : null;
            return oldSort !== newSort;
        };

        const differentIndexes = (oldSortItem: SortModelItem | undefined, newSortItem: SortModelItem | undefined) => {
            const oldIndex = oldSortItem ? oldSortModel.indexOf(oldSortItem) : -1;
            const newIndex = newSortItem ? newSortModel.indexOf(newSortItem) : -1;
            return oldIndex !== newIndex;
        };

        return allColsInBothSorts.filter(colId => {
            const oldSortItem = oldSortModel.find(sm => sm.colId === colId);
            const newSortItem = newSortModel.find(sm => sm.colId === colId);
            return differentSorts(oldSortItem, newSortItem) || differentIndexes(oldSortItem, newSortItem);
        });
    }

}