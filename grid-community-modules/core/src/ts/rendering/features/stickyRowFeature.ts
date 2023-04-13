import { RowNode } from "../../entities/rowNode";
import { BeanStub } from "../../context/beanStub";
import { RowCtrl } from "../row/rowCtrl";
import { RowCtrlMap, RowRenderer } from "../rowRenderer";
import { Autowired, PostConstruct } from "../../context/context";
import { IRowModel, RowModelType } from "../../interfaces/iRowModel";
import { GridBodyCtrl } from "../../gridBodyComp/gridBodyCtrl";
import { CtrlsService } from "../../ctrlsService";
import { last } from "../../utils/array";

export class StickyRowFeature extends BeanStub {

    @Autowired("rowModel") private rowModel: IRowModel;
    @Autowired("rowRenderer") private rowRenderer: RowRenderer;
    @Autowired("ctrlsService") private ctrlsService: CtrlsService;

    private stickyRowCtrls: RowCtrl[] = [];
    private gridBodyCtrl: GridBodyCtrl;
    private containerHeight = 0;
    private isClientSide: boolean;

    constructor(
        private readonly createRowCon: (rowNode: RowNode, animate: boolean, afterScroll: boolean) => RowCtrl,
        private readonly destroyRowCtrls: (rowCtrlsMap: RowCtrlMap | null | undefined, animate: boolean) => void
    ) {
        super();
    }

    @PostConstruct
    private postConstruct(): void {
        this.isClientSide = this.rowModel.getType() === 'clientSide';

        this.ctrlsService.whenReady(params => {
            this.gridBodyCtrl = params.gridBodyCtrl;
        });
    }

    public getStickyRowCtrls(): RowCtrl[] {
        return this.stickyRowCtrls;
    }

    public checkStickyRows(): void {
        let height = 0;

        if (!this.gridOptionsService.is('groupRowsSticky')) {
            this.refreshNodesAndContainerHeight([], height);
            return;
        }

        const stickyRows: RowNode[] = [];
        const firstPixel = this.rowRenderer.getFirstVisibleVerticalPixel();

        const addStickyRow = (stickyRow: RowNode) => {
            stickyRows.push(stickyRow);

            let lastChildBottom: number;

            if (this.isClientSide) {
                let lastAncestor = stickyRow;
                while (lastAncestor.expanded) {
                    if (lastAncestor.master) {
                        lastAncestor = lastAncestor.detailNode;
                    } else if (lastAncestor.childrenAfterSort) {
                        // Tree Data will have `childrenAfterSort` without any nodes, but
                        // the current node will still be marked as expansible.
                        if (lastAncestor.childrenAfterSort.length === 0) { break; }
                        lastAncestor = last(lastAncestor.childrenAfterSort);
                    }
                }
                lastChildBottom = lastAncestor.rowTop! + lastAncestor.rowHeight!;
            }
            // if the rowModel is `serverSide` as only `clientSide` and `serverSide` create this feature.
            else {
                const storeBounds = stickyRow.childStore?.getStoreBounds();
                lastChildBottom = (storeBounds?.heightPx ?? 0) + (storeBounds?.topPx ?? 0);
            }

            const stickRowBottom = firstPixel + height + stickyRow.rowHeight!;
            if (lastChildBottom < stickRowBottom) {
                stickyRow.stickyRowTop = height + (lastChildBottom - stickRowBottom);
            } else {
                stickyRow.stickyRowTop = height;
            }

            height = 0;
            stickyRows.forEach(rowNode => {
                const thisRowLastPx = rowNode.stickyRowTop + rowNode.rowHeight!;
                if (height < thisRowLastPx) {
                    height = thisRowLastPx;
                }
            });

        };

        while (true) {
            const firstPixelAfterStickyRows = firstPixel + height;
            const firstIndex = this.rowModel.getRowIndexAtPixel(firstPixelAfterStickyRows);
            const firstRow = this.rowModel.getRow(firstIndex);

            if (firstRow == null) {  break; }

            // only happens when pivoting, and we are showing root node
            if (firstRow.level < 0) { break; }

            const parents: RowNode[] = [];
            let p = firstRow.parent!;
            while (p.level >= 0) {
                parents.push(p);
                p = p.parent!;
            }
            const firstMissingParent = parents.reverse().find(parent => stickyRows.indexOf(parent) < 0 && parent.displayed);
            if (firstMissingParent) {
                addStickyRow(firstMissingParent);
                continue;
            }

            // if first row is an open group, and practically shown, it needs
            // to be stuck
            if (firstRow.isExpandable() && firstRow.expanded && firstRow.rowTop! < firstPixelAfterStickyRows) {
                addStickyRow(firstRow);
                continue;
            }

            break;
        }

        this.refreshNodesAndContainerHeight(stickyRows, height);
    }

    private refreshNodesAndContainerHeight(allStickyNodes: RowNode[], height: number): void {
        const removedCtrls = this.stickyRowCtrls.filter(ctrl => allStickyNodes.indexOf(ctrl.getRowNode()) === -1);
        const addedNodes = allStickyNodes.filter(rowNode => this.stickyRowCtrls.findIndex(ctrl => ctrl.getRowNode() === rowNode) === -1);

        const ctrlsToDestroy: RowCtrlMap = {};
        removedCtrls.forEach(removedCtrl => {
            ctrlsToDestroy[removedCtrl.getRowNode().id!] = removedCtrl;
            this.stickyRowCtrls = this.stickyRowCtrls.filter(ctrl => ctrl !== removedCtrl);
        });

        for (const ctrl of Object.values(ctrlsToDestroy)) {
            ctrl.getRowNode().sticky = false;
        }

        this.destroyRowCtrls(ctrlsToDestroy, false);

        const newCtrls = addedNodes.map(rowNode => {
            rowNode.sticky = true;
            return this.createRowCon(rowNode, false, false);
        });

        this.stickyRowCtrls.push(...newCtrls);
        this.stickyRowCtrls.forEach(ctrl => ctrl.setRowTop(ctrl.getRowNode().stickyRowTop));
        this.stickyRowCtrls.sort((a, b) => b.getRowNode().rowIndex! - a.getRowNode().rowIndex!);

        if (this.containerHeight !== height) {
            this.containerHeight = height;
            this.gridBodyCtrl.setStickyTopHeight(height);
        }
    }
}