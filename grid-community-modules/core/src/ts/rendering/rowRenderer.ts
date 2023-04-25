import { RowCtrl } from "./row/rowCtrl";
import { Column } from "../entities/column";
import { RowNode } from "../entities/rowNode";
import {
    BodyScrollEvent,
    CellFocusedEvent,
    DisplayedRowsChangedEvent,
    Events,
    FirstDataRenderedEvent,
    ModelUpdatedEvent,
    ViewportChangedEvent
} from "../events";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { ColumnModel } from "../columns/columnModel";
import { FocusService } from "../focusService";
import { CellPosition } from "../entities/cellPositionUtils";
import { BeanStub } from "../context/beanStub";
import { PaginationProxy } from "../pagination/paginationProxy";
import { Beans } from "./beans";
import { RowContainerHeightService } from "./rowContainerHeightService";
import { ICellRenderer } from "./cellRenderers/iCellRenderer";
import { ICellEditor } from "../interfaces/iCellEditor";
import { IRowModel } from "../interfaces/iRowModel";
import { RowPosition } from "../entities/rowPositionUtils";
import { PinnedRowModel } from "../pinnedRowModel/pinnedRowModel";
import { exists, missing } from "../utils/generic";
import { getAllValuesInObject, iterateObject } from "../utils/object";
import { createArrayOfNumbers } from "../utils/number";
import { doOnce, executeInAWhile } from "../utils/function";
import { CtrlsService } from "../ctrlsService";
import { GridBodyCtrl } from "../gridBodyComp/gridBodyCtrl";
import { CellCtrl } from "./cell/cellCtrl";
import { removeFromArray } from "../utils/array";
import { StickyRowFeature } from "./features/stickyRowFeature";
import { AnimationFrameService } from "../misc/animationFrameService";
import { browserSupportsPreventScroll } from "../utils/browser";
import { WithoutGridCommon } from "../interfaces/iCommon";
import { IRowNode } from "../interfaces/iRowNode";

export interface RowCtrlMap {
    [key: string]: RowCtrl;
}

interface RowNodeMap {
    [id: string]: IRowNode;
}

export interface GetCellsParams<TData = any> {
    /** Optional list of row nodes to restrict operation to */
    rowNodes?: IRowNode<TData>[];
    /** Optional list of columns to restrict operation to */
    columns?: (string | Column)[];
}

export interface RefreshCellsParams<TData = any> extends GetCellsParams<TData> {
    /** Skip change detection, refresh everything. */
    force?: boolean;
    /** Skip cell flashing, if cell flashing is enabled. */
    suppressFlash?: boolean;
}

export interface FlashCellsParams<TData = any> extends GetCellsParams<TData> {
    flashDelay?: number;
    fadeDelay?: number;
}

export interface GetCellRendererInstancesParams<TData = any> extends GetCellsParams<TData> { }

export interface GetCellEditorInstancesParams<TData = any> extends GetCellsParams<TData> { }

export interface RedrawRowsParams<TData = any> {
    /** Row nodes to redraw */
    rowNodes?: IRowNode<TData>[];
}

const DEFAULT_KEEP_DETAIL_ROW_COUNT = 10;
@Bean("rowRenderer")
export class RowRenderer extends BeanStub {

    @Autowired("animationFrameService") private animationFrameService: AnimationFrameService;
    @Autowired("paginationProxy") private paginationProxy: PaginationProxy;
    @Autowired("columnModel") private columnModel: ColumnModel;
    @Autowired("pinnedRowModel") private pinnedRowModel: PinnedRowModel;
    @Autowired("rowModel") private rowModel: IRowModel;
    @Autowired("focusService") private focusService: FocusService;
    @Autowired("beans") private beans: Beans;
    @Autowired("rowContainerHeightService") private rowContainerHeightService: RowContainerHeightService;
    @Autowired("ctrlsService") private ctrlsService: CtrlsService;

    private gridBodyCtrl: GridBodyCtrl;

    private destroyFuncsForColumnListeners: (() => void)[] = [];

    private firstRenderedRow: number;
    private lastRenderedRow: number;

    // map of row ids to row objects. keeps track of which elements
    // are rendered for which rows in the dom.
    private rowCtrlsByRowIndex: RowCtrlMap = {};
    private zombieRowCtrls: RowCtrlMap = {};
    private cachedRowCtrls: RowCtrlCache;
    private allRowCtrls: RowCtrl[] = [];

    private topRowCtrls: RowCtrl[] = [];
    private bottomRowCtrls: RowCtrl[] = [];

    private pinningLeft: boolean;
    private pinningRight: boolean;

    private firstVisibleVPixel: number;

    // we only allow one refresh at a time, otherwise the internal memory structure here
    // will get messed up. this can happen if the user has a cellRenderer, and inside the
    // renderer they call an API method that results in another pass of the refresh,
    // then it will be trying to draw rows in the middle of a refresh.
    private refreshInProgress = false;

    private printLayout: boolean;
    private embedFullWidthRows: boolean;
    private stickyRowFeature: StickyRowFeature;

    private dataFirstRenderedFired = false;

    @PostConstruct
    private postConstruct(): void {
        this.ctrlsService.whenReady(() => {
            this.gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
            this.initialise();
        });
    }

    private initialise(): void {
        this.addManagedListener(this.eventService, Events.EVENT_PAGINATION_CHANGED, this.onPageLoaded.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_PINNED_ROW_DATA_CHANGED, this.onPinnedRowDataChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_BODY_SCROLL, this.onBodyScroll.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_BODY_HEIGHT_CHANGED, this.redrawAfterScroll.bind(this));

        this.addManagedPropertyListener('domLayout', this.onDomLayoutChanged.bind(this));
        this.addManagedPropertyListener('rowClass', this.redrawRows.bind(this));

        if (this.gridOptionsService.is('groupRowsSticky')) {
            const rowModelType = this.rowModel.getType();
            if (rowModelType != 'clientSide' && rowModelType != 'serverSide') {
                doOnce(() => console.warn('AG Grid: The feature Sticky Row Groups only works with the Client Side or Server Side Row Model'), 'rowRenderer.stickyWorksWithCsrmOnly');
            } else {
                this.stickyRowFeature = this.createManagedBean(new StickyRowFeature(
                    this.createRowCon.bind(this),
                    this.destroyRowCtrls.bind(this)
                ));
            }
        }

        this.registerCellEventListeners();

        this.initialiseCache();
        this.printLayout = this.gridOptionsService.isDomLayout('print');
        this.embedFullWidthRows = this.printLayout || this.gridOptionsService.is('embedFullWidthRows');

        this.redrawAfterModelUpdate();
    }

    private initialiseCache(): void {
        if (this.gridOptionsService.is('keepDetailRows')) {
            const countProp = this.getKeepDetailRowsCount();
            const count = countProp != null ? countProp : 3;
            this.cachedRowCtrls = new RowCtrlCache(count);
        }
    }

    private getKeepDetailRowsCount(): number | undefined {
        const keepDetailRowsCount = this.gridOptionsService.getNum('keepDetailRowsCount');
        if (exists(keepDetailRowsCount) && keepDetailRowsCount > 0) {
            return keepDetailRowsCount;
        }

        return DEFAULT_KEEP_DETAIL_ROW_COUNT;
    }

    public getRowCtrls(): RowCtrl[] {
        return this.allRowCtrls;
    }

    public getStickyTopRowCtrls(): RowCtrl[] {
        if (!this.stickyRowFeature) { return []; }

        return this.stickyRowFeature.getStickyRowCtrls();
    }

    private updateAllRowCtrls(): void {
        const liveList = getAllValuesInObject(this.rowCtrlsByRowIndex);
        const isEnsureDomOrder = this.gridOptionsService.is('ensureDomOrder');
        const isPrintLayout = this.gridOptionsService.isDomLayout('print');

        if (isEnsureDomOrder || isPrintLayout) {
            liveList.sort((a, b) => a.getRowNode().rowIndex - b.getRowNode.rowIndex);
        }
        const zombieList = getAllValuesInObject(this.zombieRowCtrls);
        const cachedList = this.cachedRowCtrls ? this.cachedRowCtrls.getEntries() : [];
        this.allRowCtrls = [...liveList, ...zombieList, ...cachedList];
    }

    private onCellFocusChanged(event?: CellFocusedEvent) {
        this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onCellFocused(event));
        this.getFullWidthRowCtrls().forEach(rowCtrl => rowCtrl.onFullWidthRowFocused(event));
    }

    // in a clean design, each cell would register for each of these events. however when scrolling, all the cells
    // registering and de-registering for events is a performance bottleneck. so we register here once and inform
    // all active cells.
    private registerCellEventListeners(): void {
        this.addManagedListener(this.eventService, Events.EVENT_CELL_FOCUSED, (event: CellFocusedEvent) => {
            this.onCellFocusChanged(event);
        });

        this.addManagedListener(this.eventService, Events.EVENT_CELL_FOCUS_CLEARED, () => {
            this.onCellFocusChanged();
        });

        this.addManagedListener(this.eventService, Events.EVENT_FLASH_CELLS, event => {
            this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onFlashCells(event));
        });

        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_HOVER_CHANGED, () => {
            this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onColumnHover());
        });

        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, () => {
            this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onDisplayedColumnsChanged());
        });

        // only for printLayout - because we are rendering all the cells in the same row, regardless of pinned state,
        // then changing the width of the containers will impact left position. eg the center cols all have their
        // left position adjusted by the width of the left pinned column, so if the pinned left column width changes,
        // all the center cols need to be shifted to accommodate this. when in normal layout, the pinned cols are
        // in different containers so doesn't impact.
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, () => {
            if (this.printLayout) {
                this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onLeftChanged());
            }
        });

        const rangeSelectionEnabled = this.gridOptionsService.isEnableRangeSelection();
        if (rangeSelectionEnabled) {

            this.addManagedListener(this.eventService, Events.EVENT_RANGE_SELECTION_CHANGED, () => {
                this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onRangeSelectionChanged());
            });
            this.addManagedListener(this.eventService, Events.EVENT_COLUMN_MOVED, () => {
                this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.updateRangeBordersIfRangeCount());
            });
            this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PINNED, () => {
                this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.updateRangeBordersIfRangeCount());
            });
            this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VISIBLE, () => {
                this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.updateRangeBordersIfRangeCount());
            });

        }

        // add listeners to the grid columns
        this.refreshListenersToColumnsForCellComps();
        // if the grid columns change, then refresh the listeners again
        this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, this.refreshListenersToColumnsForCellComps.bind(this));

        this.addDestroyFunc(this.removeGridColumnListeners.bind(this));
    }

    // executes all functions in destroyFuncsForColumnListeners and then clears the list
    private removeGridColumnListeners(): void {
        this.destroyFuncsForColumnListeners.forEach(func => func());
        this.destroyFuncsForColumnListeners.length = 0;
    }

    // this function adds listeners onto all the grid columns, which are the column that we could have cellComps for.
    // when the grid columns change, we add listeners again. in an ideal design, each CellComp would just register to
    // the column it belongs to on creation, however this was a bottleneck with the number of cells, so do it here
    // once instead.
    private refreshListenersToColumnsForCellComps(): void {
        this.removeGridColumnListeners();

        const cols = this.columnModel.getAllGridColumns();

        if (!cols) { return; }

        cols.forEach(col => {
            const forEachCellWithThisCol = (callback: (cellCtrl: CellCtrl) => void) => {
                this.getAllCellCtrls().forEach(cellCtrl => {
                    if (cellCtrl.getColumn() === col) {
                        callback(cellCtrl);
                    }
                });
            };

            const leftChangedListener = () => {
                forEachCellWithThisCol(cellCtrl => cellCtrl.onLeftChanged());
            };
            const widthChangedListener = () => {
                forEachCellWithThisCol(cellCtrl => cellCtrl.onWidthChanged());
            };
            const firstRightPinnedChangedListener = () => {
                forEachCellWithThisCol(cellCtrl => cellCtrl.onFirstRightPinnedChanged());
            };
            const lastLeftPinnedChangedListener = () => {
                forEachCellWithThisCol(cellCtrl => cellCtrl.onLastLeftPinnedChanged());
            };
            const colDefChangedListener = () => {
                forEachCellWithThisCol(cellCtrl => cellCtrl.onColDefChanged());
            };

            col.addEventListener('leftChanged', leftChangedListener);
            col.addEventListener('widthChanged', widthChangedListener);
            col.addEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
            col.addEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
            col.addEventListener('colDefChanged', colDefChangedListener);

            this.destroyFuncsForColumnListeners.push(() => {
                col.removeEventListener('leftChanged', leftChangedListener);
                col.removeEventListener('widthChanged', widthChangedListener);
                col.removeEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
                col.removeEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
                col.removeEventListener('colDefChanged', colDefChangedListener);
            });
        });
    }

    private onDomLayoutChanged(): void {
        const printLayout = this.gridOptionsService.isDomLayout('print');
        const embedFullWidthRows = printLayout || this.gridOptionsService.is('embedFullWidthRows');

        // if moving towards or away from print layout, means we need to destroy all rows, as rows are not laid
        // out using absolute positioning when doing print layout
        const destroyRows = embedFullWidthRows !== this.embedFullWidthRows || this.printLayout !== printLayout;

        this.printLayout = printLayout;
        this.embedFullWidthRows = embedFullWidthRows;

        if (destroyRows) {
            this.redrawAfterModelUpdate({ domLayoutChanged: true });
        }
    }

    // for row models that have datasources, when we update the datasource, we need to force the rowRenderer
    // to redraw all rows. otherwise the old rows from the old datasource will stay displayed.
    public datasourceChanged(): void {
        this.firstRenderedRow = 0;
        this.lastRenderedRow = -1;
        const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
        this.removeRowCtrls(rowIndexesToRemove);
    }

    private onPageLoaded(event: ModelUpdatedEvent): void {
        const params: RefreshViewParams = {
            recycleRows: event.keepRenderedRows,
            animate: event.animate,
            newData: event.newData,
            newPage: event.newPage,
            // because this is a model updated event (not pinned rows), we
            // can skip updating the pinned rows. this is needed so that if user
            // is doing transaction updates, the pinned rows are not getting constantly
            // trashed - or editing cells in pinned rows are not refreshed and put into read mode
            onlyBody: true
        };
        this.redrawAfterModelUpdate(params);
    }

    public getAllCellsForColumn(column: Column): HTMLElement[] {
        const res: HTMLElement[] = [];

        this.getAllRowCtrls().forEach(rowCtrl => {
            const eCell = rowCtrl.getCellElement(column);
            if (eCell) { res.push(eCell); }
        });

        return res;
    }

    public refreshFloatingRowComps(): void {
        this.refreshFloatingRows(
            this.topRowCtrls,
            this.pinnedRowModel.getPinnedTopRowData()
        );

        this.refreshFloatingRows(
            this.bottomRowCtrls,
            this.pinnedRowModel.getPinnedBottomRowData()
        );
    }

    public getTopRowCtrls(): RowCtrl[] {
        return this.topRowCtrls;
    }

    public getBottomRowCtrls(): RowCtrl[] {
        return this.bottomRowCtrls;
    }

    private refreshFloatingRows(rowComps: RowCtrl[], rowNodes: RowNode[]): void {
        rowComps.forEach((row: RowCtrl) => {
            row.destroyFirstPass();
            row.destroySecondPass();
        });

        rowComps.length = 0;

        if (!rowNodes) { return; }

        rowNodes.forEach(rowNode => {
            const rowCtrl = new RowCtrl(
                rowNode,
                this.beans,
                false,
                false,
                this.printLayout
            );

            rowComps.push(rowCtrl);
        });
    }

    private onPinnedRowDataChanged(): void {
        // recycling rows in order to ensure cell editing is not cancelled
        const params: RefreshViewParams = {
            recycleRows: true
        };

        this.redrawAfterModelUpdate(params);
    }

    // if the row nodes are not rendered, no index is returned
    private getRenderedIndexesForRowNodes(rowNodes: IRowNode[]): string[] {
        const result: string[] = [];

        if (missing(rowNodes)) { return result; }

        iterateObject(this.rowCtrlsByRowIndex, (index: string, renderedRow: RowCtrl) => {
            const rowNode = renderedRow.getRowNode();
            if (rowNodes.indexOf(rowNode) >= 0) {
                result.push(index);
            }
        });

        return result;
    }

    public redrawRows(rowNodes?: IRowNode[]): void {
        // if no row nodes provided, then refresh everything
        const partialRefresh = rowNodes != null && rowNodes.length > 0;

        if (partialRefresh) {
            const indexesToRemove = this.getRenderedIndexesForRowNodes(rowNodes!);
            // remove the rows
            this.removeRowCtrls(indexesToRemove);
        }

        // add draw them again
        this.redrawAfterModelUpdate({
            recycleRows: partialRefresh
        });
    }

    private getCellToRestoreFocusToAfterRefresh(params?: RefreshViewParams): CellPosition | null {
        const focusedCell = (params?.suppressKeepFocus) ? null : this.focusService.getFocusCellToUseAfterRefresh();

        if (focusedCell == null) { return null; }

        // if the dom is not actually focused on a cell, then we don't try to refocus. the problem this
        // solves is with editing - if the user is editing, eg focus is on a text field, and not on the
        // cell itself, then the cell can be registered as having focus, however it's the text field that
        // has the focus and not the cell div. therefore, when the refresh is finished, the grid will focus
        // the cell, and not the textfield. that means if the user is in a text field, and the grid refreshes,
        // the focus is lost from the text field. we do not want this.
        const eDocument = this.gridOptionsService.getDocument();
        const activeElement = eDocument.activeElement;
        const cellDomData = this.gridOptionsService.getDomData(activeElement, CellCtrl.DOM_DATA_KEY_CELL_CTRL);
        const rowDomData = this.gridOptionsService.getDomData(activeElement, RowCtrl.DOM_DATA_KEY_ROW_CTRL);

        const gridElementFocused = cellDomData || rowDomData;

        return gridElementFocused ? focusedCell : null;
    }

    // gets called from:
    // +) initialisation (in registerGridComp) params = null
    // +) onDomLayoutChanged, params = null
    // +) onPageLoaded, recycleRows, animate, newData, newPage from event, onlyBody=true
    // +) onPinnedRowDataChanged, recycleRows = true
    // +) redrawRows (from Grid API), recycleRows = true/false
    private redrawAfterModelUpdate(params: RefreshViewParams = {}): void {
        this.getLockOnRefresh();

        const focusedCell: CellPosition | null = this.getCellToRestoreFocusToAfterRefresh(params);

        this.updateContainerHeights();
        this.scrollToTopIfNewData(params);

        // never recycle rows on layout change as rows could change from normal DOM layout
        // back to the grid's row positioning.
        const recycleRows: boolean = !params.domLayoutChanged && !!params.recycleRows;
        const animate = params.animate && this.gridOptionsService.isAnimateRows();

        // after modelUpdate, row indexes can change, so we clear out the rowsByIndex map,
        // however we can reuse the rows, so we keep them but index by rowNode.id
        const rowsToRecycle = recycleRows ? this.recycleRows() : null;
        if (!recycleRows) {
            this.removeAllRowComps();
        }

        this.redraw(rowsToRecycle, animate);

        this.gridBodyCtrl.updateRowCount();

        if (!params.onlyBody) {
            this.refreshFloatingRowComps();
        }

        this.dispatchDisplayedRowsChanged();

        // if a cell was focused before, ensure focus now.
        if (focusedCell != null) {
            this.restoreFocusedCell(focusedCell);
        }

        this.releaseLockOnRefresh();
    }

    private scrollToTopIfNewData(params: RefreshViewParams): void {
        const scrollToTop = params.newData || params.newPage;
        const suppressScrollToTop = this.gridOptionsService.is('suppressScrollOnNewData');

        if (scrollToTop && !suppressScrollToTop) {
            this.gridBodyCtrl.getScrollFeature().scrollToTop();
        }
    }

    private updateContainerHeights(): void {
        // when doing print layout, we don't explicitly set height on the containers
        if (this.printLayout) {
            this.rowContainerHeightService.setModelHeight(null);
            return;
        }

        let containerHeight = this.paginationProxy.getCurrentPageHeight();
        // we need at least 1 pixel for the horizontal scroll to work. so if there are now rows,
        // we still want the scroll to be present, otherwise there would be no way to scroll the header
        // which might be needed us user wants to access columns
        // on the RHS - and if that was where the filter was that cause no rows to be presented, there
        // is no way to remove the filter.
        if (containerHeight === 0) {
            containerHeight = 1;
        }

        this.rowContainerHeightService.setModelHeight(containerHeight);
    }

    private getLockOnRefresh(): void {
        if (this.refreshInProgress) {
            throw new Error(
                "AG Grid: cannot get grid to draw rows when it is in the middle of drawing rows. " +
                "Your code probably called a grid API method while the grid was in the render stage. To overcome " +
                "this, put the API call into a timeout, e.g. instead of api.redrawRows(), " +
                "call setTimeout(function() { api.redrawRows(); }, 0). To see what part of your code " +
                "that caused the refresh check this stacktrace."
            );
        }

        this.refreshInProgress = true;
    }

    private releaseLockOnRefresh(): void {
        this.refreshInProgress = false;
    }

    public isRefreshInProgress(): boolean {
        return this.refreshInProgress;
    }

    // sets the focus to the provided cell, if the cell is provided. this way, the user can call refresh without
    // worry about the focus been lost. this is important when the user is using keyboard navigation to do edits
    // and the cellEditor is calling 'refresh' to get other cells to update (as other cells might depend on the
    // edited cell).
    private restoreFocusedCell(cellPosition: CellPosition | null): void {
        if (cellPosition) {
            // we don't wish to dispatch an event as the rowRenderer is not capable of changing the selected cell,
            // so we mock a change event for the full width rows and cells to ensure they update to the newly selected
            // state
            this.onCellFocusChanged({
                rowIndex: cellPosition.rowIndex,
                column: cellPosition.column,
                rowPinned: cellPosition.rowPinned,
                forceBrowserFocus: true,
                preventScrollOnBrowserFocus: true,
                api: this.beans.gridApi,
                columnApi: this.beans.columnApi,
                context: this.beans.gridOptionsService.context,
                type: 'mock',
            });
        }
    }

    public stopEditing(cancel: boolean = false) {
        this.getAllRowCtrls().forEach(rowCtrl => {
            rowCtrl.stopEditing(cancel);
        });
    }

    public getAllCellCtrls(): CellCtrl[] {
        const res: CellCtrl[] = [];
        const rowCtrls = this.getAllRowCtrls();
        const rowCtrlsLength = rowCtrls.length;

        for (let i = 0; i < rowCtrlsLength; i++) {
            const cellCtrls = rowCtrls[i].getAllCellCtrls();
            const cellCtrlsLength = cellCtrls.length;

            for (let j = 0; j < cellCtrlsLength; j++) {
                res.push(cellCtrls[j]);
            }
        }

        return res;
    }

    private getAllRowCtrls(): RowCtrl[] {
        const stickyRowCtrls = (this.stickyRowFeature && this.stickyRowFeature.getStickyRowCtrls()) || [];
        const res = [...this.topRowCtrls, ...this.bottomRowCtrls, ...stickyRowCtrls];

        for (const key of Object.keys(this.rowCtrlsByRowIndex)) {
            res.push(this.rowCtrlsByRowIndex[key]);
        }
        return res;
    }

    public addRenderedRowListener(eventName: string, rowIndex: number, callback: Function): void {
        const rowComp = this.rowCtrlsByRowIndex[rowIndex];
        if (rowComp) {
            rowComp.addEventListener(eventName, callback);
        }
    }

    public flashCells(params: FlashCellsParams = {}): void {
        const { flashDelay, fadeDelay } = params;
        this.getCellCtrls(params.rowNodes, params.columns)
            .forEach(cellCtrl => cellCtrl.flashCell({ flashDelay, fadeDelay }));
    }

    public refreshCells(params: RefreshCellsParams = {}): void {
        const refreshCellParams = {
            forceRefresh: params.force,
            newData: false,
            suppressFlash: params.suppressFlash
        };
        this.getCellCtrls(params.rowNodes, params.columns)
            .forEach(cellCtrl => {
                if (cellCtrl.refreshShouldDestroy()) {
                    const rowCtrl = cellCtrl.getRowCtrl();
                    if (rowCtrl) {
                        rowCtrl.refreshCell(cellCtrl);
                    }
                } else {
                    cellCtrl.refreshCell(refreshCellParams);
                }
            });
        this.getFullWidthRowCtrls(params.rowNodes).forEach(fullWidthRowCtrl => {
            fullWidthRowCtrl.refreshFullWidth();
        });
    }

    public getCellRendererInstances(params: GetCellRendererInstancesParams): ICellRenderer[] {
        const cellRenderers = this.getCellCtrls(params.rowNodes, params.columns)
            .map(cellCtrl => cellCtrl.getCellRenderer())
            .filter(renderer => renderer != null) as ICellRenderer[];
        if (params.columns?.length) {
            return cellRenderers;
        }

        const fullWidthRenderers: ICellRenderer[] = [];
        const rowIdMap = this.mapRowNodes(params.rowNodes);

        this.getAllRowCtrls().forEach(rowCtrl => {
            if (rowIdMap && !this.isRowInMap(rowCtrl.getRowNode(), rowIdMap)) {
                return;
            }

            if (!rowCtrl.isFullWidth()) {
                return;
            }

            const fullWidthRenderer = rowCtrl.getFullWidthCellRenderer();
            if (fullWidthRenderer) {
                fullWidthRenderers.push(fullWidthRenderer);
            }
        });

        return [...fullWidthRenderers, ...cellRenderers];
    }

    public getCellEditorInstances(params: GetCellRendererInstancesParams): ICellEditor[] {

        const res: ICellEditor[] = [];

        this.getCellCtrls(params.rowNodes, params.columns).forEach(cellCtrl => {
            const cellEditor = cellCtrl.getCellEditor() as ICellEditor;

            if (cellEditor) {
                res.push(cellEditor);
            }
        });

        return res;
    }

    public getEditingCells(): CellPosition[] {
        const res: CellPosition[] = [];

        this.getAllCellCtrls().forEach(cellCtrl => {
            if (cellCtrl.isEditing()) {
                const cellPosition = cellCtrl.getCellPosition();
                res.push(cellPosition);
            }
        });

        return res;
    }

    private mapRowNodes(rowNodes?: IRowNode[] | null): { top: RowNodeMap, bottom: RowNodeMap, normal: RowNodeMap } | undefined {
        if (!rowNodes) { return; }

        const res: {top: RowNodeMap, bottom: RowNodeMap, normal: RowNodeMap} = {
            top: {},
            bottom: {},
            normal: {}
        };

        rowNodes.forEach(rowNode => {
            const id = rowNode.id!;
            if (rowNode.rowPinned === 'top') {
                res.top[id] = rowNode;
            } else if (rowNode.rowPinned === 'bottom') {
                res.bottom[id] = rowNode;
            } else {
                res.normal[id] = rowNode;
            }
        });

        return res;
    }

    private isRowInMap(rowNode: RowNode, rowIdsMap: {top: RowNodeMap, bottom: RowNodeMap, normal: RowNodeMap}): boolean {
        // skip this row if it is missing from the provided list
        const id = rowNode.id!;
        const floating = rowNode.rowPinned;

        if (floating === 'bottom') {
            return rowIdsMap.bottom[id] != null;
        }

        if (floating === 'top') {
            return rowIdsMap.top[id] != null;
        }

        return rowIdsMap.normal[id] != null;
    }

    // returns CellCtrl's that match the provided rowNodes and columns. eg if one row node
    // and two columns provided, that identifies 4 cells, so 4 CellCtrl's returned.
    private getCellCtrls(rowNodes?: IRowNode[] | null, columns?: (string | Column)[]): CellCtrl[] {
        const rowIdsMap = this.mapRowNodes(rowNodes);
        const res: CellCtrl[] = [];

        let colIdsMap: any;

        if (exists(columns)) {
            colIdsMap = {};
            columns.forEach((colKey: string | Column) => {
                const column: Column | null = this.columnModel.getGridColumn(colKey);
                if (exists(column)) {
                    colIdsMap[column.getId()] = true;
                }
            });
        }

        const processRow = (rowCtrl: RowCtrl) => {
            const rowNode: RowNode = rowCtrl.getRowNode();

            // skip this row if it is missing from the provided list
            if (rowIdsMap != null && !this.isRowInMap(rowNode, rowIdsMap)) { return; }

            rowCtrl.getAllCellCtrls().forEach(cellCtrl => {
                const colId: string = cellCtrl.getColumn().getId();
                const excludeColFromRefresh = colIdsMap && !colIdsMap[colId];

                if (excludeColFromRefresh) { return; }

                res.push(cellCtrl);
            });
        };

        this.getAllRowCtrls().forEach(row => processRow(row));

        return res;
    }

    protected destroy(): void {
        this.removeAllRowComps();
        super.destroy();
    }

    private removeAllRowComps(): void {
        const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
        this.removeRowCtrls(rowIndexesToRemove);
    }

    private recycleRows(): RowCtrlMap {
        // remove all stub nodes, they can't be reused, as no rowNode id
        const stubNodeIndexes: string[] = [];
        iterateObject(this.rowCtrlsByRowIndex, (index: string, rowComp: RowCtrl) => {
            const stubNode = rowComp.getRowNode().id == null;
            if (stubNode) {
                stubNodeIndexes.push(index);
            }
        });
        this.removeRowCtrls(stubNodeIndexes);

        // then clear out rowCompsByIndex, but before that take a copy, but index by id, not rowIndex
        const ctrlsByIdMap: RowCtrlMap = {};
        iterateObject(this.rowCtrlsByRowIndex, (index: string, rowComp: RowCtrl) => {
            const rowNode = rowComp.getRowNode();
            ctrlsByIdMap[rowNode.id!] = rowComp;
        });
        this.rowCtrlsByRowIndex = {};

        return ctrlsByIdMap;
    }

    // takes array of row indexes
    private removeRowCtrls(rowsToRemove: any[]) {
        // if no fromIndex then set to -1, which will refresh everything
        // let realFromIndex = -1;
        rowsToRemove.forEach(indexToRemove => {
            const rowCtrl = this.rowCtrlsByRowIndex[indexToRemove];
            if (rowCtrl) {
                rowCtrl.destroyFirstPass();
                rowCtrl.destroySecondPass();
            }
            delete this.rowCtrlsByRowIndex[indexToRemove];
        });
    }

    private onBodyScroll(e: BodyScrollEvent) {
        if (e.direction !== 'vertical') { return; }
        this.redrawAfterScroll();
    }

    // gets called when rows don't change, but viewport does, so after:
    // 1) height of grid body changes, ie number of displayed rows has changed
    // 2) grid scrolled to new position
    // 3) ensure index visible (which is a scroll)
    public redrawAfterScroll() {
        let cellFocused: CellPosition | undefined;

        // only try to refocus cells shifting in and out of sticky container
        // if the browser supports focus ({ preventScroll })
        if (this.stickyRowFeature && browserSupportsPreventScroll()) {
            cellFocused = this.getCellToRestoreFocusToAfterRefresh() || undefined;
        }

        this.getLockOnRefresh();
        this.redraw(null, false, true);
        this.releaseLockOnRefresh();
        this.dispatchDisplayedRowsChanged();

        if (cellFocused != null) {
            const newFocusedCell = this.getCellToRestoreFocusToAfterRefresh();

            if (cellFocused != null && newFocusedCell == null) {
                this.animationFrameService.flushAllFrames();
                this.restoreFocusedCell(cellFocused);
            }
        }
    }

    private removeRowCompsNotToDraw(indexesToDraw: number[]): void {
        // for speedy lookup, dump into map
        const indexesToDrawMap: { [index: string]: boolean; } = {};
        indexesToDraw.forEach(index => (indexesToDrawMap[index] = true));

        const existingIndexes = Object.keys(this.rowCtrlsByRowIndex);
        const indexesNotToDraw: string[] = existingIndexes.filter(index => !indexesToDrawMap[index]);

        this.removeRowCtrls(indexesNotToDraw);
    }

    private calculateIndexesToDraw(rowsToRecycle?: { [key: string]: RowCtrl; } | null): number[] {
        // all in all indexes in the viewport
        let indexesToDraw = createArrayOfNumbers(this.firstRenderedRow, this.lastRenderedRow);

        const checkRowToDraw = (indexStr: string, rowComp: RowCtrl) => {
            const index = rowComp.getRowNode().rowIndex;
            if (index == null) { return; }
            if (index < this.firstRenderedRow || index > this.lastRenderedRow) {
                if (this.doNotUnVirtualiseRow(rowComp)) {
                    indexesToDraw.push(index);
                }
            }
        };

        // if we are redrawing due to scrolling change, then old rows are in this.rowCompsByIndex
        iterateObject(this.rowCtrlsByRowIndex, checkRowToDraw);

        // if we are redrawing due to model update, then old rows are in rowsToRecycle
        iterateObject(rowsToRecycle, checkRowToDraw);

        indexesToDraw.sort((a: number, b: number) => a - b);

        indexesToDraw = indexesToDraw.filter(index => {
            const rowNode = this.paginationProxy.getRow(index);
            return rowNode && !rowNode.sticky;
        });

        return indexesToDraw;
    }

    private redraw(rowsToRecycle?: { [key: string]: RowCtrl; } | null, animate = false, afterScroll = false) {
        this.rowContainerHeightService.updateOffset();
        this.workOutFirstAndLastRowsToRender();

        if (this.stickyRowFeature) {
            this.stickyRowFeature.checkStickyRows();
        }

        // the row can already exist and be in the following:
        // rowsToRecycle -> if model change, then the index may be different, however row may
        //                         exist here from previous time (mapped by id).
        // this.rowCompsByIndex -> if just a scroll, then this will contain what is currently in the viewport

        // this is all the indexes we want, including those that already exist, so this method
        // will end up going through each index and drawing only if the row doesn't already exist
        const indexesToDraw = this.calculateIndexesToDraw(rowsToRecycle);

        this.removeRowCompsNotToDraw(indexesToDraw);

        // never animate when doing print layout - as we want to get things ready to print as quickly as possible,
        // otherwise we risk the printer printing a row that's half faded (half way through fading in)
        if (this.printLayout) {
            animate = false;
        }

        // add in new rows
        const rowCtrls: RowCtrl[] = [];

        indexesToDraw.forEach(rowIndex => {
            const rowCtrl = this.createOrUpdateRowCtrl(rowIndex, rowsToRecycle, animate, afterScroll);
            if (exists(rowCtrl)) {
                rowCtrls.push(rowCtrl);
            }
        });

        if (rowsToRecycle) {
            const useAnimationFrame = afterScroll && !this.gridOptionsService.is('suppressAnimationFrame') && !this.printLayout;
            if (useAnimationFrame) {
                this.beans.animationFrameService.addDestroyTask(() => {
                    this.destroyRowCtrls(rowsToRecycle, animate);
                    this.updateAllRowCtrls();
                    this.dispatchDisplayedRowsChanged();
                });
            } else {
                this.destroyRowCtrls(rowsToRecycle, animate);
            }
        }

        this.updateAllRowCtrls();
    }

    private dispatchDisplayedRowsChanged(): void {
        const event: WithoutGridCommon<DisplayedRowsChangedEvent> = { type: Events.EVENT_DISPLAYED_ROWS_CHANGED };
        this.eventService.dispatchEvent(event);
    }

    private onDisplayedColumnsChanged(): void {
        const pinningLeft = this.columnModel.isPinningLeft();
        const pinningRight = this.columnModel.isPinningRight();
        const atLeastOneChanged = this.pinningLeft !== pinningLeft || pinningRight !== this.pinningRight;

        if (atLeastOneChanged) {
            this.pinningLeft = pinningLeft;
            this.pinningRight = pinningRight;

            if (this.embedFullWidthRows) {
                this.redrawFullWidthEmbeddedRows();
            }
        }
    }

    // when embedding, what gets showed in each section depends on what is pinned. eg if embedding group expand / collapse,
    // then it should go into the pinned left area if pinning left, or the center area if not pinning.
    private redrawFullWidthEmbeddedRows(): void {
        // if either of the pinned panels has shown / hidden, then need to redraw the fullWidth bits when
        // embedded, as what appears in each section depends on whether we are pinned or not
        const rowsToRemove: string[] = [];

        this.getFullWidthRowCtrls().forEach(fullWidthCtrl => {
            const rowIndex = fullWidthCtrl.getRowNode().rowIndex;
            rowsToRemove.push(rowIndex!.toString());
        });

        this.refreshFloatingRowComps();
        this.removeRowCtrls(rowsToRemove);
        this.redrawAfterScroll();
    }

    public getFullWidthRowCtrls(rowNodes?: IRowNode[]): RowCtrl[] {
        const rowNodesMap = this.mapRowNodes(rowNodes);
        
        return this.getAllRowCtrls().filter((rowCtrl: RowCtrl) => {
            // include just full width
            if (!rowCtrl.isFullWidth()) { return false; }

            // if Row Nodes provided, we exclude where Row Node is missing
            const rowNode = rowCtrl.getRowNode();
            if (rowNodesMap != null && !this.isRowInMap(rowNode, rowNodesMap)) { return false; }

            return true;
        });
    }

    public refreshFullWidthRow(rowNode: RowNode) {
        const fullWidthCtrl = this.getFullWidthRowCtrls().find(rowCtrl => rowCtrl.getRowNode() === rowNode);
        if (!fullWidthCtrl) {
            return;
        }

        const refreshed = fullWidthCtrl.refreshFullWidth();
        if (refreshed) {
            return;
        }

        if (rowNode.sticky) {
            this.stickyRowFeature.refreshStickyNode(rowNode);
        } else {
            this.removeRowCtrls([rowNode.rowIndex!]);
        }
        this.redrawAfterScroll();
    }

    private createOrUpdateRowCtrl(
        rowIndex: number,
        rowsToRecycle: { [key: string]: RowCtrl | null; } | null | undefined,
        animate: boolean,
        afterScroll: boolean
    ): RowCtrl | null | undefined {
        let rowNode: RowNode | undefined;
        let rowCtrl: RowCtrl | null = this.rowCtrlsByRowIndex[rowIndex];

        // if no row comp, see if we can get it from the previous rowComps
        if (!rowCtrl) {
            rowNode = this.paginationProxy.getRow(rowIndex);
            if (exists(rowNode) && exists(rowsToRecycle) && rowsToRecycle[rowNode.id!] && rowNode.alreadyRendered) {
                rowCtrl = rowsToRecycle[rowNode.id!];
                rowsToRecycle[rowNode.id!] = null;
            }
        }

        const creatingNewRowCtrl = !rowCtrl;

        if (creatingNewRowCtrl) {
            // create a new one
            if (!rowNode) {
                rowNode = this.paginationProxy.getRow(rowIndex);
            }

            if (exists(rowNode)) {
                rowCtrl = this.createRowCon(rowNode, animate, afterScroll);
            } else {
                // this should never happen - if somehow we are trying to create
                // a row for a rowNode that does not exist.
                return;
            }
        }

        if (rowNode) {
            // set node as 'alreadyRendered' to ensure we only recycle rowComps that have been rendered, this ensures
            // we don't reuse rowComps that have been removed and then re-added in the same batch transaction.
            rowNode.alreadyRendered = true;
        }

        this.rowCtrlsByRowIndex[rowIndex] = rowCtrl!;

        return rowCtrl;
    }

    private destroyRowCtrls(rowCtrlsMap: RowCtrlMap | null | undefined, animate: boolean): void {
        const executeInAWhileFuncs: (() => void)[] = [];
        iterateObject(rowCtrlsMap, (nodeId: string, rowCtrl: RowCtrl) => {
            // if row was used, then it's null
            if (!rowCtrl) { return; }

            if (this.cachedRowCtrls && rowCtrl.isCacheable()) {
                this.cachedRowCtrls.addRow(rowCtrl);
                return;
            }

            rowCtrl.destroyFirstPass();
            if (animate) {
                this.zombieRowCtrls[rowCtrl.getInstanceId()] = rowCtrl;
                executeInAWhileFuncs.push(() => {
                    rowCtrl.destroySecondPass();
                    delete this.zombieRowCtrls[rowCtrl.getInstanceId()];
                });
            } else {
                rowCtrl.destroySecondPass();
            }
        });
        if (animate) {
            // this ensures we fire displayedRowsChanged AFTER all the 'executeInAWhileFuncs' get
            // executed, as we added it to the end of the list.
            executeInAWhileFuncs.push(() => {
                this.updateAllRowCtrls();
                this.dispatchDisplayedRowsChanged();
            });
            executeInAWhile(executeInAWhileFuncs);
        }
    }

    private getRowBuffer(): number {
        let rowBuffer = this.gridOptionsService.getNum('rowBuffer');

        if (typeof rowBuffer === 'number') {
            if (rowBuffer < 0) {
                doOnce(() => console.warn(`AG Grid: rowBuffer should not be negative`), 'warn rowBuffer negative');
                rowBuffer = 0;
                this.gridOptionsService.set('rowBuffer', 0);
            }
        } else {
            rowBuffer = 10;
        }

        return rowBuffer;
    }

    private getRowBufferInPixels() {
        const rowsToBuffer = this.getRowBuffer();
        const defaultRowHeight = this.gridOptionsService.getRowHeightAsNumber();

        return rowsToBuffer * defaultRowHeight;
    }

    private workOutFirstAndLastRowsToRender(): void {
        let newFirst: number;
        let newLast: number;

        if (!this.paginationProxy.isRowsToRender()) {
            newFirst = 0;
            newLast = -1; // setting to -1 means nothing in range
        } else if (this.printLayout) {
            newFirst = this.paginationProxy.getPageFirstRow();
            newLast = this.paginationProxy.getPageLastRow();
        } else {
            const bufferPixels = this.getRowBufferInPixels();
            const gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
            const suppressRowVirtualisation = this.gridOptionsService.is('suppressRowVirtualisation');

            let rowHeightsChanged = false;
            let firstPixel: number;
            let lastPixel: number;
            do {
                const paginationOffset = this.paginationProxy.getPixelOffset();
                const {pageFirstPixel, pageLastPixel} = this.paginationProxy.getCurrentPagePixelRange();
                const divStretchOffset = this.rowContainerHeightService.getDivStretchOffset();

                const bodyVRange = gridBodyCtrl.getScrollFeature().getVScrollPosition();
                const bodyTopPixel = bodyVRange.top;
                const bodyBottomPixel = bodyVRange.bottom;

                if (suppressRowVirtualisation) {
                    firstPixel = pageFirstPixel + divStretchOffset;
                    lastPixel = pageLastPixel + divStretchOffset;
                } else {
                    firstPixel = Math.max(bodyTopPixel + paginationOffset - bufferPixels, pageFirstPixel) + divStretchOffset;
                    lastPixel = Math.min(bodyBottomPixel + paginationOffset + bufferPixels, pageLastPixel) + divStretchOffset;
                }

                this.firstVisibleVPixel = Math.max(bodyTopPixel + paginationOffset, pageFirstPixel) + divStretchOffset;

                // if the rows we are about to display get their heights changed, then that upsets the calcs from above.
                rowHeightsChanged = this.ensureAllRowsInRangeHaveHeightsCalculated(firstPixel, lastPixel);

            } while (rowHeightsChanged);

            let firstRowIndex = this.paginationProxy.getRowIndexAtPixel(firstPixel);
            let lastRowIndex = this.paginationProxy.getRowIndexAtPixel(lastPixel);

            const pageFirstRow = this.paginationProxy.getPageFirstRow();
            const pageLastRow = this.paginationProxy.getPageLastRow();

            // adjust, in case buffer extended actual size
            if (firstRowIndex < pageFirstRow) {
                firstRowIndex = pageFirstRow;
            }

            if (lastRowIndex > pageLastRow) {
                lastRowIndex = pageLastRow;
            }

            newFirst = firstRowIndex;
            newLast = lastRowIndex;
        }

        // sometimes user doesn't set CSS right and ends up with grid with no height and grid ends up
        // trying to render all the rows, eg 10,000+ rows. this will kill the browser. so instead of
        // killing the browser, we limit the number of rows. just in case some use case we didn't think
        // of, we also have a property to not do this operation.
        const rowLayoutNormal = this.gridOptionsService.isDomLayout('normal');
        const suppressRowCountRestriction = this.gridOptionsService.is('suppressMaxRenderedRowRestriction');
        const rowBufferMaxSize = Math.max(this.getRowBuffer(), 500);

        if (rowLayoutNormal && !suppressRowCountRestriction) {
            if (newLast - newFirst > rowBufferMaxSize) {
                newLast = newFirst + rowBufferMaxSize;
            }
        }

        const firstDiffers = newFirst !== this.firstRenderedRow;
        const lastDiffers = newLast !== this.lastRenderedRow;

        if (firstDiffers || lastDiffers) {
            this.firstRenderedRow = newFirst;
            this.lastRenderedRow = newLast;

            const event: WithoutGridCommon<ViewportChangedEvent> = {
                type: Events.EVENT_VIEWPORT_CHANGED,
                firstRow: newFirst,
                lastRow: newLast
            };

            this.eventService.dispatchEvent(event);
        }
    }

    /**
     * This event will only be fired once, and is queued until after the browser next renders.
     * This allows us to fire an event during the start of the render cycle, when we first see data being rendered
     * but not execute the event until all of the data has finished being rendered to the dom.
     */
    public dispatchFirstDataRenderedEvent() {
        if (this.dataFirstRenderedFired) { return; }
        this.dataFirstRenderedFired = true;

        const event: WithoutGridCommon<FirstDataRenderedEvent> = {
            type: Events.EVENT_FIRST_DATA_RENDERED,
            firstRow: this.firstRenderedRow,
            lastRow: this.lastRenderedRow,
        };

        // See AG-7018
        window.requestAnimationFrame(() => {
            this.beans.eventService.dispatchEvent(event);
        });
    }

    private ensureAllRowsInRangeHaveHeightsCalculated(topPixel: number, bottomPixel: number): boolean {
        // ensureRowHeightsVisible only works with CSRM, as it's the only row model that allows lazy row height calcs.
        // all the other row models just hard code so the method just returns back false
        const res = this.paginationProxy.ensureRowHeightsValid(topPixel, bottomPixel, -1, -1);

        if (res) {
            this.updateContainerHeights();
        }

        return res;
    }

    public getFirstVisibleVerticalPixel(): number {
        return this.firstVisibleVPixel;
    }

    public getFirstVirtualRenderedRow() {
        return this.firstRenderedRow;
    }

    public getLastVirtualRenderedRow() {
        return this.lastRenderedRow;
    }

    // check that none of the rows to remove are editing or focused as:
    // a) if editing, we want to keep them, otherwise the user will loose the context of the edit,
    //    eg user starts editing, enters some text, then scrolls down and then up, next time row rendered
    //    the edit is reset - so we want to keep it rendered.
    // b) if focused, we want ot keep keyboard focus, so if user ctrl+c, it goes to clipboard,
    //    otherwise the user can range select and drag (with focus cell going out of the viewport)
    //    and then ctrl+c, nothing will happen if cell is removed from dom.
    // c) if detail record of master detail, as users complained that the context of detail rows
    //    was getting lost when detail row out of view. eg user expands to show detail row,
    //    then manipulates the detail panel (eg sorts the detail grid), then context is lost
    //    after detail panel is scrolled out of / into view.
    private doNotUnVirtualiseRow(rowComp: RowCtrl): boolean {
        const REMOVE_ROW: boolean = false;
        const KEEP_ROW: boolean = true;
        const rowNode = rowComp.getRowNode();

        const rowHasFocus = this.focusService.isRowNodeFocused(rowNode);
        const rowIsEditing = rowComp.isEditing();
        const rowIsDetail = rowNode.detail;

        const mightWantToKeepRow = rowHasFocus || rowIsEditing || rowIsDetail;

        // if we deffo don't want to keep it,
        if (!mightWantToKeepRow) {
            return REMOVE_ROW;
        }

        // editing row, only remove if it is no longer rendered, eg filtered out or new data set.
        // the reason we want to keep is if user is scrolling up and down, we don't want to loose
        // the context of the editing in process.
        const rowNodePresent = this.paginationProxy.isRowPresent(rowNode);
        return rowNodePresent ? KEEP_ROW : REMOVE_ROW;
    }

    private createRowCon(rowNode: RowNode, animate: boolean, afterScroll: boolean): RowCtrl {

        const rowCtrlFromCache = this.cachedRowCtrls ? this.cachedRowCtrls.getRow(rowNode) : null;
        if (rowCtrlFromCache) { return rowCtrlFromCache; }

        // we don't use animations frames for printing, so the user can put the grid into print mode
        // and immediately print - otherwise the user would have to wait for the rows to draw in the background
        // (via the animation frames) which is awkward to do from code.

        // we only do the animation frames after scrolling, as this is where we want the smooth user experience.
        // having animation frames for other times makes the grid look 'jumpy'.

        const suppressAnimationFrame = this.gridOptionsService.is('suppressAnimationFrame');
        const useAnimationFrameForCreate = afterScroll && !suppressAnimationFrame && !this.printLayout;

        const res = new RowCtrl(
            rowNode,
            this.beans,
            animate,
            useAnimationFrameForCreate,
            this.printLayout
        );

        return res;
    }

    public getRenderedNodes() {
        const renderedRows = this.rowCtrlsByRowIndex;

        return Object.keys(renderedRows).map(key => renderedRows[key]!.getRowNode());
    }

    public getRowByPosition(rowPosition: RowPosition): RowCtrl | null {
        let rowCtrl: RowCtrl | null;
        const {rowIndex} = rowPosition;
        switch (rowPosition.rowPinned) {
            case 'top':
                rowCtrl = this.topRowCtrls[rowIndex];
                break;
            case 'bottom':
                rowCtrl = this.bottomRowCtrls[rowIndex];
                break;
            default:
                rowCtrl = this.rowCtrlsByRowIndex[rowIndex];
                if (!rowCtrl) {
                    rowCtrl = this.getStickyTopRowCtrls().find(ctrl => ctrl.getRowNode().rowIndex === rowIndex) || null;
                }
                break;
        }

        return rowCtrl;
    }

    public getRowNode(gridRow: RowPosition): RowNode | undefined {
        switch (gridRow.rowPinned) {
            case 'top':
                return this.pinnedRowModel.getPinnedTopRowData()[gridRow.rowIndex];
            case 'bottom':
                return this.pinnedRowModel.getPinnedBottomRowData()[gridRow.rowIndex];
            default:
                return this.rowModel.getRow(gridRow.rowIndex);
        }
    }

    // returns true if any row between startIndex and endIndex is rendered. used by
    // SSRM or IRM, as they don't want to purge visible blocks from cache.
    public isRangeInRenderedViewport(startIndex: number, endIndex: number): boolean {

        // parent closed means the parent node is not expanded, thus these blocks are not visible
        const parentClosed = startIndex == null || endIndex == null;
        if (parentClosed) { return false; }

        const blockAfterViewport = startIndex > this.lastRenderedRow;
        const blockBeforeViewport = endIndex < this.firstRenderedRow;
        const blockInsideViewport = !blockBeforeViewport && !blockAfterViewport;

        return blockInsideViewport;
    }
}

class RowCtrlCache {

    // map for fast access
    private entriesMap: RowCtrlMap = {};

    // list for keeping order
    private entriesList: RowCtrl[] = [];

    private readonly maxCount: number;

    constructor(maxCount: number) {
        this.maxCount = maxCount;
    }

    public addRow(rowCtrl: RowCtrl): void {
        this.entriesMap[rowCtrl.getRowNode().id!] = rowCtrl;
        this.entriesList.push(rowCtrl);
        rowCtrl.setCached(true);

        if (this.entriesList.length > this.maxCount) {
            const rowCtrlToDestroy = this.entriesList[0];
            rowCtrlToDestroy.destroyFirstPass();
            rowCtrlToDestroy.destroySecondPass();
            this.removeFromCache(rowCtrlToDestroy);
        }
    }

    public getRow(rowNode: RowNode): RowCtrl | null {
        if (rowNode == null || rowNode.id == null) { return null; }

        const res = this.entriesMap[rowNode.id];

        if (!res) { return null; }

        this.removeFromCache(res);
        res.setCached(false);

        // this can happen if user reloads data, and a new RowNode is reusing
        // the same ID as the old one
        const rowNodeMismatch = res.getRowNode() != rowNode;

        return rowNodeMismatch ? null : res;
    }

    private removeFromCache(rowCtrl: RowCtrl): void {
        const rowNodeId = rowCtrl.getRowNode().id!;
        delete this.entriesMap[rowNodeId];
        removeFromArray(this.entriesList, rowCtrl);
    }

    public getEntries(): RowCtrl[] {
        return this.entriesList;
    }
}

export interface RefreshViewParams {
    recycleRows?: boolean;
    animate?: boolean;
    suppressKeepFocus?: boolean;
    onlyBody?: boolean;
    // when new data, grid scrolls back to top
    newData?: boolean;
    newPage?: boolean;
    domLayoutChanged?: boolean;
}
