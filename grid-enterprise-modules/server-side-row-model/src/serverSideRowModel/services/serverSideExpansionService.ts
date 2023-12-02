import {
    Autowired,
    Bean,
    Events,
    ExpansionService,
    IExpansionService,
    IsServerSideGroupOpenByDefaultParams,
    RowNode,
    WithoutGridCommon
} from "@ag-grid-community/core";
import { ServerSideRowModel } from "../serverSideRowModel";

@Bean('expansionService')
export class ServerSideExpansionService extends ExpansionService implements IExpansionService {
    @Autowired('rowModel') private readonly serverSideRowModel: ServerSideRowModel;

    private queuedRowIds: Set<string> = new Set();

    protected postConstruct(): void {
        super.postConstruct();
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, () => {
            this.queuedRowIds.clear();
        });
    }

    public checkOpenByDefault(rowNode: RowNode): void {
        if (!rowNode.isExpandable()) { return; }

        const expandRowNode = () => {
            // we do this in a timeout, so that we don't expand a row node while in the middle
            // of setting up rows, setting up rows is complex enough without another chunk of work
            // getting added to the call stack. this is also helpful as openByDefault may or may
            // not happen (so makes setting up rows more deterministic by expands never happening)
            // and also checkOpenByDefault is shard with both store types, so easier control how it
            // impacts things by keeping it in new VM turn.
            window.setTimeout(() => rowNode.setExpanded(true), 0);
        }

        if (this.queuedRowIds.has(rowNode.id!)) {
            this.queuedRowIds.delete(rowNode.id!);
            expandRowNode();
            return;
        }

        const userFunc = this.gridOptionsService.getCallback('isServerSideGroupOpenByDefault');
        if (!userFunc) { return; }

        const params: WithoutGridCommon<IsServerSideGroupOpenByDefaultParams> = {
            data: rowNode.data,
            rowNode
        };

        const userFuncRes = userFunc(params);

        if (userFuncRes) {
            expandRowNode();
        }
    }

    public expandRows(rowIds: string[]): void {
        rowIds.forEach(rowId => {
            const rowNode = this.serverSideRowModel.getRowNode(rowId);
            if (rowNode) {
                rowNode.setExpanded(true);
            } else {
                this.queuedRowIds.add(rowId);
            }
        });
    }

    public expandAll(value: boolean): void {
        this.serverSideRowModel.expandAll(value);
    }

    public onGroupExpandedOrCollapsed(): void {
        // do nothing
    }
}