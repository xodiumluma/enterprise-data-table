import { ColumnModel } from "../../columns/columnModel";
import { BeanStub } from "../../context/beanStub";
import { Autowired, PostConstruct } from "../../context/context";
import { Column, ColumnPinnedType } from "../../entities/column";
import { ColumnGroup } from "../../entities/columnGroup";
import { IHeaderColumn } from "../../interfaces/iHeaderColumn";
import { Events } from "../../eventKeys";
import { VirtualColumnsChangedEvent } from "../../events";
import { FocusService } from "../../focusService";
import { isBrowserSafari } from "../../utils/browser";
import { AbstractHeaderCellCtrl } from "../cells/abstractCell/abstractHeaderCellCtrl";
import { HeaderFilterCellCtrl } from "../cells/floatingFilter/headerFilterCellCtrl";
import { HeaderCellCtrl } from "../cells/column/headerCellCtrl";
import { HeaderGroupCellCtrl } from "../cells/columnGroup/headerGroupCellCtrl";
import { HeaderRowType } from "./headerRowComp";
import { values } from "../../utils/generic";
import { FilterManager } from "../../filter/filterManager";

export interface IHeaderRowComp {
    setTop(top: string): void;
    setHeight(height: string): void;
    setHeaderCtrls(ctrls: AbstractHeaderCellCtrl[], forceOrder: boolean, afterScroll: boolean): void;
    setWidth(width: string): void;
}

let instanceIdSequence = 0;

export class HeaderRowCtrl extends BeanStub {

    @Autowired('columnModel') private columnModel: ColumnModel;
    @Autowired('focusService') private focusService: FocusService;
    @Autowired('filterManager') private filterManager: FilterManager;

    private comp: IHeaderRowComp;
    private rowIndex: number;
    private pinned: ColumnPinnedType;
    private type: HeaderRowType;
    private headerRowClass: string;

    private instanceId = instanceIdSequence++;

    private headerCellCtrls: Map<string, AbstractHeaderCellCtrl> | undefined;

    private isPrintLayout: boolean;
    private isEnsureDomOrder: boolean;

    constructor(rowIndex: number, pinned: ColumnPinnedType, type: HeaderRowType) {
        super();
        this.rowIndex = rowIndex;
        this.pinned = pinned;
        this.type = type;

        const typeClass = type == HeaderRowType.COLUMN_GROUP ? `ag-header-row-column-group` :
            type == HeaderRowType.FLOATING_FILTER ? `ag-header-row-column-filter` : `ag-header-row-column`;
        this.headerRowClass = `ag-header-row ${typeClass}`;

    }

    @PostConstruct
    private postConstruct(): void {
        this.isPrintLayout = this.gridOptionsService.isDomLayout('print');
        this.isEnsureDomOrder = this.gridOptionsService.get('ensureDomOrder');
    }


    public getInstanceId(): number {
        return this.instanceId;
    }

    /**
     * 
     * @param comp Proxy to the actual component
     * @param initCompState Should the component be initialised with the current state of the controller. Default: true
     */
    public setComp(comp: IHeaderRowComp, initCompState: boolean = true): void {
        this.comp = comp;

        if (initCompState) {
            this.onRowHeightChanged();
            this.onVirtualColumnsChanged();
        }
        // width is managed directly regardless of framework and so is not included in initCompState
        this.setWidth(); 

        this.addEventListeners();
    }

    public getHeaderRowClass(): string {
        return this.headerRowClass;
    }
    public getAriaRowIndex(): number {
        return this.rowIndex + 1;
    }
    public getTransform(): string | undefined {
        if (isBrowserSafari()) {
            // fix for a Safari rendering bug that caused the header to flicker above chart panels
            // as you move the mouse over the header
            return 'translateZ(0)';
        }
    }


    private addEventListeners(): void {
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_RESIZED, this.onColumnResized.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_VIRTUAL_COLUMNS_CHANGED, (params: VirtualColumnsChangedEvent) => this.onVirtualColumnsChanged(params.afterScroll));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_HEADER_HEIGHT_CHANGED, this.onRowHeightChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_GRID_STYLES_CHANGED, this.onRowHeightChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED, this.onRowHeightChanged.bind(this));

        // when print layout changes, it changes what columns are in what section
        this.addManagedPropertyListener('domLayout', this.onDisplayedColumnsChanged.bind(this));
        this.addManagedPropertyListener('ensureDomOrder', (e) => this.isEnsureDomOrder = e.currentValue);

        this.addManagedPropertyListener('headerHeight', this.onRowHeightChanged.bind(this));
        this.addManagedPropertyListener('pivotHeaderHeight', this.onRowHeightChanged.bind(this));
        this.addManagedPropertyListener('groupHeaderHeight', this.onRowHeightChanged.bind(this));
        this.addManagedPropertyListener('pivotGroupHeaderHeight', this.onRowHeightChanged.bind(this));
        this.addManagedPropertyListener('floatingFiltersHeight', this.onRowHeightChanged.bind(this));
    }

    public getHeaderCellCtrl(column: ColumnGroup): HeaderGroupCellCtrl | undefined;
    public getHeaderCellCtrl(column: Column): HeaderCellCtrl | undefined;
    public getHeaderCellCtrl(column: any): any {
        if (!this.headerCellCtrls) { return; }
        return values(this.headerCellCtrls).find(cellCtrl => cellCtrl.getColumnGroupChild() === column);
    }

    private onDisplayedColumnsChanged(): void {
        this.isPrintLayout = this.gridOptionsService.isDomLayout('print');
        this.onVirtualColumnsChanged();
        this.setWidth();
        this.onRowHeightChanged();
    }

    public getType(): HeaderRowType {
        return this.type;
    }

    private onColumnResized(): void {
        this.setWidth();
    }

    private setWidth(): void {
        const width = this.getWidthForRow();
        this.comp.setWidth(`${width}px`);
    }

    private getWidthForRow(): number {
        if (this.isPrintLayout) {
            const pinned = this.pinned != null;
            if (pinned) { return 0; }

            return this.columnModel.getContainerWidth('right')
                + this.columnModel.getContainerWidth('left')
                + this.columnModel.getContainerWidth(null);
        }

        // if not printing, just return the width as normal
        return this.columnModel.getContainerWidth(this.pinned);
    }

    private onRowHeightChanged(): void {
        var { topOffset, rowHeight } = this.getTopAndHeight();

        this.comp.setTop(topOffset + 'px');
        this.comp.setHeight(rowHeight + 'px');
    }

    public getTopAndHeight() {
        let headerRowCount = this.columnModel.getHeaderRowCount();
        const sizes: number[] = [];

        let numberOfFloating = 0;

        if (this.filterManager.hasFloatingFilters()) {
            headerRowCount++;
            numberOfFloating = 1;
        }

        const groupHeight = this.columnModel.getColumnGroupHeaderRowHeight();
        const headerHeight = this.columnModel.getColumnHeaderRowHeight();

        const numberOfNonGroups = 1 + numberOfFloating;
        const numberOfGroups = headerRowCount - numberOfNonGroups;

        for (let i = 0; i < numberOfGroups; i++) { sizes.push(groupHeight as number); }

        sizes.push(headerHeight);

        for (let i = 0; i < numberOfFloating; i++) { sizes.push(this.columnModel.getFloatingFiltersHeight() as number); }

        let topOffset = 0;

        for (let i = 0; i < this.rowIndex; i++) { topOffset += sizes[i]; }

        const rowHeight = sizes[this.rowIndex];
        return { topOffset, rowHeight };
    }

    public getPinned(): ColumnPinnedType {
        return this.pinned;
    }

    public getRowIndex(): number {
        return this.rowIndex;
    }

    private onVirtualColumnsChanged(afterScroll: boolean = false): void {
        const ctrlsToDisplay = this.getHeaderCtrls();
        const forceOrder = this.isEnsureDomOrder || this.isPrintLayout;
        this.comp.setHeaderCtrls(ctrlsToDisplay, forceOrder, afterScroll);
    }

    public getHeaderCtrls() {
        const oldCtrls = this.headerCellCtrls;
        this.headerCellCtrls = new Map();
        const columns = this.getColumnsInViewport();

        for (const child of columns) {
            this.recycleAndCreateHeaderCtrls(child, oldCtrls)
        }

        // we want to keep columns that are focused, otherwise keyboard navigation breaks
        const isFocusedAndDisplayed = (ctrl: HeaderCellCtrl) => {
            const isFocused = this.focusService.isHeaderWrapperFocused(ctrl);
            if (!isFocused) { return false; }
            const isDisplayed = this.columnModel.isDisplayed(ctrl.getColumnGroupChild());
            return isDisplayed;
        };

        if (oldCtrls) {
            for (const [id, oldCtrl] of oldCtrls) {
                const keepCtrl = isFocusedAndDisplayed(oldCtrl as HeaderCellCtrl);
                if (keepCtrl) {
                    this.headerCellCtrls.set(id, oldCtrl);
                } else {
                    this.destroyBean(oldCtrl);
                }
            }
        }


        const ctrlsToDisplay = Array.from(this.headerCellCtrls.values());
        return ctrlsToDisplay;
    }

    private recycleAndCreateHeaderCtrls(headerColumn: IHeaderColumn, oldCtrls?: Map<string, AbstractHeaderCellCtrl>): void {
        if (!this.headerCellCtrls) { return; }
        // skip groups that have no displayed children. this can happen when the group is broken,
        // and this section happens to have nothing to display for the open / closed state.
        // (a broken group is one that is split, ie columns in the group have a non-group column
        // in between them)
        if (headerColumn.isEmptyGroup()) { return; }

        const idOfChild = headerColumn.getUniqueId();

        // if we already have this cell rendered, do nothing
        let headerCtrl: AbstractHeaderCellCtrl | undefined;
        if (oldCtrls) {
            headerCtrl = oldCtrls.get(idOfChild);
            oldCtrls.delete(idOfChild);
        }

        // it's possible there is a new Column with the same ID, but it's for a different Column.
        // this is common with pivoting, where the pivot cols change, but the id's are still pivot_0,
        // pivot_1 etc. so if new col but same ID, need to remove the old col here first as we are
        // about to replace it in the this.headerComps map.
        const forOldColumn = headerCtrl && headerCtrl.getColumnGroupChild() != headerColumn;
        if (forOldColumn) {
            this.destroyBean(headerCtrl);
            headerCtrl = undefined;
        }

        if (headerCtrl == null) {
            switch (this.type) {
                case HeaderRowType.FLOATING_FILTER:
                    headerCtrl = this.createBean(new HeaderFilterCellCtrl(headerColumn as Column, this));
                    break;
                case HeaderRowType.COLUMN_GROUP:
                    headerCtrl = this.createBean(new HeaderGroupCellCtrl(headerColumn as ColumnGroup, this));
                    break;
                default:
                    headerCtrl = this.createBean(new HeaderCellCtrl(headerColumn as Column, this));
                    break;
            }
        }

        this.headerCellCtrls.set(idOfChild, headerCtrl);
    }

    private getColumnsInViewport(): IHeaderColumn[] {
        return this.isPrintLayout ? this.getColumnsInViewportPrintLayout() : this.getColumnsInViewportNormalLayout();
    }

    private getColumnsInViewportPrintLayout(): IHeaderColumn[] {
        // for print layout, we add all columns into the center
        if (this.pinned != null) { return []; }

        let viewportColumns: IHeaderColumn[] = [];
        const actualDepth = this.getActualDepth();

        (['left', null, 'right'] as ColumnPinnedType[]).forEach(pinned => {
            const items = this.columnModel.getVirtualHeaderGroupRow(pinned, actualDepth);
            viewportColumns = viewportColumns.concat(items);
        });

        return viewportColumns;
    }

    private getActualDepth(): number {
        return this.type == HeaderRowType.FLOATING_FILTER ? this.rowIndex - 1 : this.rowIndex;
    }

    private getColumnsInViewportNormalLayout(): IHeaderColumn[] {
        // when in normal layout, we add the columns for that container only
        return this.columnModel.getVirtualHeaderGroupRow(this.pinned, this.getActualDepth());
    }

    public focusHeader(column: IHeaderColumn, event?: KeyboardEvent): boolean {
        if (!this.headerCellCtrls) { return false; }

        const allCtrls = Array.from(this.headerCellCtrls.values());
        const ctrl: AbstractHeaderCellCtrl | undefined = allCtrls.find(ctrl => ctrl.getColumnGroupChild() == column);

        if (!ctrl) { return false; }

        return ctrl.focus(event);
    }

    protected destroy(): void {
        if (this.headerCellCtrls) {
            this.headerCellCtrls.forEach((ctrl) => {
                this.destroyBean(ctrl);
            });
        }
        this.headerCellCtrls = undefined;
        super.destroy();
    }
}