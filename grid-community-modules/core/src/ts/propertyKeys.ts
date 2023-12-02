import { GridOptions } from "./entities/gridOptions";
import { AgGridCommon } from "./interfaces/iCommon";

type GridOptionKey = keyof GridOptions;

type GetKeys<T, U> = {
    [K in keyof T]: U extends T[K] ? K :
    (T[K] extends U | null | undefined ? K : never) //Reverse match for string literal types
}[keyof T];

/**
 *  Get the GridProperties that are of type `any`.
 *  Works by finding the properties that can extend a non existing string.
 *  This will only be the properties of type `any`.
 */
export type AnyGridOptions = {
    [K in keyof GridOptions]: GridOptions[K] extends 'NO_MATCH' ? K : never
}[keyof GridOptions];

/**
 * Get all the GridOptions properties of the provided type.
 * Will also include `any` properties. 
 */
type KeysLike<U> = Exclude<GetKeys<GridOptions, U>, undefined>;
/**
 * Get all the GridOption properties that strictly contain the provided type.
 * Does not include `any` properties.
 */
type KeysOfType<U> = Exclude<GetKeys<GridOptions, U>, AnyGridOptions>;
type CallbackKeys = KeysOfType<(any: AgGridCommon<any, any>) => any>;
/** All function properties excluding those explicity match the common callback interface. */
type FunctionKeys = Exclude<KeysLike<Function>, CallbackKeys>;

export const INITIAL_GRID_OPTION_KEYS = {
    statusBar: true,
    enableBrowserTooltips: true,
    tooltipTrigger: true,
    tooltipMouseTrack: true,
    tooltipInteraction: true,
    defaultColGroupDef: true,
    suppressAutoSize: true,
    skipHeaderOnAutoSize: true,
    autoSizeStrategy: true,
    components: true,
    stopEditingWhenCellsLoseFocus: true,
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: true,
    excelStyles: true,
    cacheQuickFilter: true,
    excludeHiddenColumnsFromQuickFilter: true,
    advancedFilterModel: true,
    customChartThemes: true,
    chartThemeOverrides: true,
    enableChartToolPanelsButton: true,
    suppressChartToolPanelsButton: true,
    chartToolPanelsDef: true,
    loadingCellRendererSelector: true,
    localeText: true,
    keepDetailRows: true,
    keepDetailRowsCount: true,
    detailRowHeight: true,
    detailRowAutoHeight: true,
    alignedGrids: true,
    tabIndex: true,
    valueCache: true,
    valueCacheNeverExpires: true,
    enableCellExpressions: true,
    suppressParentsInRowNodes: true,
    suppressTouch: true,
    suppressAsyncEvents: true,
    suppressBrowserResizeObserver: true,
    suppressPropertyNamesCheck: true,
    debug: true,
    loadingOverlayComponent: true,
    loadingOverlayComponentParams: true,
    suppressLoadingOverlay: true,
    noRowsOverlayComponent: true,
    noRowsOverlayComponentParams: true,
    paginationPageSizeSelector: true,
    paginateChildRows: true,
    pivotPanelShow: true,
    pivotSuppressAutoColumn: true,
    suppressExpandablePivotGroups: true,
    aggFuncs: true,
    suppressAggFuncInHeader: true,
    suppressAggAtRootLevel: true,
    removePivotHeaderRowWhenSingleValueColumn: true,
    allowShowChangeAfterFilter: true,
    ensureDomOrder: true,
    enableRtl: true,
    suppressColumnVirtualisation: true,
    suppressMaxRenderedRowRestriction: true,
    suppressRowVirtualisation: true,
    rowDragText: true,
    suppressGroupMaintainValueType: true,
    autoGroupColumnDef: true,
    groupLockGroupColumns: true,
    rowGroupPanelSuppressSort: true,
    suppressGroupRowsSticky: true,
    rowModelType: true,
    cacheOverflowSize: true,
    infiniteInitialRowCount: true,
    serverSideInitialRowCount: true,
    suppressServerSideInfiniteScroll: true,
    maxBlocksInCache: true,
    maxConcurrentDatasourceRequests: true,
    blockLoadDebounceMillis: true,
    serverSideOnlyRefreshFilteredGroups: true,
    serverSidePivotResultFieldSeparator: true,
    viewportRowModelPageSize: true,
    viewportRowModelBufferSize: true,
    debounceVerticalScrollbar: true,
    suppressAnimationFrame: true,
    suppressPreventDefaultOnMouseWheel: true,
    scrollbarWidth: true,
    icons: true,
    suppressRowTransform: true,
    gridId: true,
    functionsPassive: true,
    enableGroupEdit: true,
    initialState: true,
    processUnpinnedColumns: true,
    createChartContainer: true,
    getLocaleText: true,
    getRowId: true,
};

type InitialGridOptionKey = keyof typeof INITIAL_GRID_OPTION_KEYS;

export type ManagedGridOptionKey = Exclude<GridOptionKey, InitialGridOptionKey>;

export type ManagedGridOptions = {
    [K in (keyof GridOptions & ManagedGridOptionKey)]: GridOptions[K]
};

/**
 * These keys are used for validating properties supplied on a gridOptions object, and for code generation.
 * If you change the properties on the gridOptions interface, you *must* update this file as well to be consistent.
 */
export class PropertyKeys {
    public static STRING_PROPERTIES: KeysOfType<string>[] = [
        'rowSelection', 'overlayLoadingTemplate', 'overlayNoRowsTemplate', 'gridId', 'quickFilterText', 'rowModelType', 'editType', 'domLayout', 
        'clipboardDelimiter', 'rowGroupPanelShow', 'multiSortKey', 'pivotColumnGroupTotals', 'pivotRowTotals', 'pivotPanelShow', 'fillHandleDirection',
        'groupDisplayType', 'treeDataDisplayType', 'colResizeDefault', 'tooltipTrigger', 'serverSidePivotResultFieldSeparator',
    ];

    public static OBJECT_PROPERTIES: KeysLike<object | HTMLElement>[] = [
        'components', 'rowStyle', 'context', 'autoGroupColumnDef', 'localeText', 'icons', 'datasource', 'serverSideDatasource', 'viewportDatasource',
        'groupRowRendererParams', 'aggFuncs', 'fullWidthCellRendererParams', 'defaultColGroupDef', 'defaultColDef', 'defaultCsvExportParams',
        'defaultExcelExportParams', 'columnTypes', 'rowClassRules', 'detailCellRendererParams', 'loadingCellRendererParams', 'loadingOverlayComponentParams',
        'noRowsOverlayComponentParams', 'popupParent', 'statusBar', 'sideBar', 'chartThemeOverrides', 'customChartThemes', 'chartToolPanelsDef',
        'dataTypeDefinitions', 'advancedFilterModel', 'advancedFilterParent', 'advancedFilterBuilderParams', 'initialState', 'autoSizeStrategy',
    ];

    public static ARRAY_PROPERTIES: KeysOfType<any[]>[] = [
        'sortingOrder', 'alignedGrids', 'rowData', 'columnDefs', 'excelStyles', 'pinnedTopRowData', 'pinnedBottomRowData', 'chartThemes',
        'rowClass', 'paginationPageSizeSelector',
    ];

    public static NUMBER_PROPERTIES: KeysOfType<number>[] = [
        'rowHeight', 'detailRowHeight', 'rowBuffer', 'headerHeight', 'groupHeaderHeight', 'groupLockGroupColumns', 'floatingFiltersHeight',
        'pivotHeaderHeight', 'pivotGroupHeaderHeight', 'groupDefaultExpanded', 'pivotDefaultExpanded', 'viewportRowModelPageSize',
        'viewportRowModelBufferSize', 'autoSizePadding', 'maxBlocksInCache', 'maxConcurrentDatasourceRequests', 'tooltipShowDelay',
        'tooltipHideDelay', 'cacheOverflowSize', 'paginationPageSize', 'cacheBlockSize', 'infiniteInitialRowCount', 'serverSideInitialRowCount',
        'scrollbarWidth', 'asyncTransactionWaitMillis', 'blockLoadDebounceMillis', 'keepDetailRowsCount', 'undoRedoCellEditingLimit',
        'cellFlashDelay', 'cellFadeDelay', 'tabIndex'
    ];

    public static BOOLEAN_PROPERTIES: KeysOfType<boolean>[] = [
        'suppressMakeColumnVisibleAfterUnGroup', 'suppressRowClickSelection', 'suppressCellFocus', 'suppressHorizontalScroll', 'groupSelectsChildren',
        'alwaysShowHorizontalScroll', 'alwaysShowVerticalScroll', 'debug', 'enableBrowserTooltips', 'enableCellExpressions', 'groupIncludeTotalFooter',
        'groupSuppressBlankHeader', 'suppressMenuHide', 'suppressRowDeselection', 'unSortIcon', 'suppressMultiSort', 'alwaysMultiSort', 'singleClickEdit',
        'suppressLoadingOverlay', 'suppressNoRowsOverlay', 'suppressAutoSize', 'skipHeaderOnAutoSize', 'suppressParentsInRowNodes', 'suppressColumnMoveAnimation',
        'suppressMovableColumns', 'suppressFieldDotNotation', 'enableRangeSelection', 'enableRangeHandle', 'enableFillHandle', 'suppressClearOnFillReduction',
        'deltaSort', 'suppressTouch', 'suppressAsyncEvents', 'allowContextMenuWithControlKey', 'suppressContextMenu', 'enableCellChangeFlash', 
        'suppressDragLeaveHidesColumns', 'suppressRowGroupHidesColumns', 'suppressMiddleClickScrolls', 'suppressPreventDefaultOnMouseWheel',
        'suppressCopyRowsToClipboard',  'copyHeadersToClipboard', 'copyGroupHeadersToClipboard', 'pivotMode', 'suppressAggFuncInHeader',
        'suppressColumnVirtualisation', 'alwaysAggregateAtRootLevel', 'suppressAggAtRootLevel', 'suppressFocusAfterRefresh', 'functionsPassive',
        'functionsReadOnly', 'animateRows',  'groupSelectsFiltered', 'groupRemoveSingleChildren', 'groupRemoveLowestSingleChildren', 'enableRtl',
        'suppressClickEdit', 'rowDragEntireRow', 'rowDragManaged', 'suppressRowDrag', 'suppressMoveWhenRowDragging', 'rowDragMultiRow', 'enableGroupEdit',
        'embedFullWidthRows', 'suppressPaginationPanel', 'groupHideOpenParents', 'groupAllowUnbalanced', 'pagination', 'paginationAutoPageSize',
        'suppressScrollOnNewData', 'suppressScrollWhenPopupsAreOpen', 'purgeClosedRowNodes', 'cacheQuickFilter', 'includeHiddenColumnsInQuickFilter',
        'excludeHiddenColumnsFromQuickFilter', 'ensureDomOrder', 'accentedSort', 'suppressChangeDetection', 'valueCache', 'valueCacheNeverExpires',
        'aggregateOnlyChangedColumns', 'suppressAnimationFrame', 'suppressExcelExport', 'suppressCsvExport', 'includeHiddenColumnsInAdvancedFilter',
        'suppressMultiRangeSelection', 'enterMovesDown', 'enterMovesDownAfterEdit', 'enterNavigatesVerticallyAfterEdit', 'enterNavigatesVertically',
        'suppressPropertyNamesCheck', 'rowMultiSelectWithClick', 'suppressRowHoverHighlight', 'suppressRowTransform', 'suppressClipboardPaste',
        'suppressLastEmptyLineOnPaste', 'enableCharts', 'enableChartToolPanelsButton', 'suppressChartToolPanelsButton', 'suppressMaintainUnsortedOrder',
        'enableCellTextSelection', 'suppressBrowserResizeObserver', 'suppressMaxRenderedRowRestriction',  'excludeChildrenWhenTreeDataFiltering',
        'tooltipMouseTrack', 'tooltipInteraction', 'keepDetailRows', 'paginateChildRows', 'preventDefaultOnContextMenu', 'undoRedoCellEditing',
        'allowDragFromColumnsToolPanel', 'pivotSuppressAutoColumn', 'suppressExpandablePivotGroups', 'debounceVerticalScrollbar', 'detailRowAutoHeight',
        'serverSideFilterAllLevels', 'serverSideSortAllLevels', 'serverSideOnlyRefreshFilteredGroups', 'serverSideSortOnServer', 'serverSideFilterOnServer',
        'suppressAggFilteredOnly', 'showOpenedGroup', 'suppressClipboardApi', 'suppressModelUpdateAfterUpdateTransaction', 'stopEditingWhenCellsLoseFocus',
        'maintainColumnOrder', 'groupMaintainOrder', 'columnHoverHighlight', 'readOnlyEdit', 'suppressRowVirtualisation', 'enableCellEditingOnBackspace',
        'resetRowDataOnUpdate', 'removePivotHeaderRowWhenSingleValueColumn', 'suppressCopySingleCellRanges', 'suppressGroupRowsSticky', 'suppressCutToClipboard',
        'suppressServerSideInfiniteScroll', 'rowGroupPanelSuppressSort', 'allowShowChangeAfterFilter','enableAdvancedFilter', 'masterDetail', 'treeData',
        'suppressGroupMaintainValueType'
    ];

    /** You do not need to include event callbacks in this list, as they are generated automatically. */
    public static FUNCTIONAL_PROPERTIES: FunctionKeys[] = [
        'doesExternalFilterPass', 'processPivotResultColDef', 'processPivotResultColGroupDef', 'getBusinessKeyForNode',  'isRowSelectable', 'rowDragText',
        'groupRowRenderer', 'fullWidthCellRenderer', 'loadingCellRenderer',  'loadingOverlayComponent', 'noRowsOverlayComponent', 'detailCellRenderer',
        'quickFilterParser', 'quickFilterMatcher'
    ];

    /** These callbacks extend AgGridCommon interface */
    public static CALLBACK_PROPERTIES: CallbackKeys[] = [
        'getLocaleText', 'isExternalFilterPresent', 'getRowHeight', 'getRowClass', 'getRowStyle', 'getContextMenuItems', 'getMainMenuItems',
        'processRowPostCreate', 'processCellForClipboard', 'getGroupRowAgg', 'isFullWidthRow', 'sendToClipboard', 'navigateToNextHeader',
        'tabToNextHeader', 'navigateToNextCell', 'tabToNextCell', 'processCellFromClipboard', 'getDocument', 'postProcessPopup', 'getChildCount',
        'getDataPath', 'isRowMaster', 'postSortRows', 'processHeaderForClipboard', 'processUnpinnedColumns', 'processGroupHeaderForClipboard',
        'paginationNumberFormatter', 'processDataFromClipboard', 'getServerSideGroupKey', 'isServerSideGroup', 'createChartContainer',
        'getChartToolbarItems', 'fillOperation', 'isApplyServerSideTransaction','getServerSideGroupLevelParams', 'isServerSideGroupOpenByDefault',
        'isGroupOpenByDefault', 'initialGroupOrderComparator', 'groupIncludeFooter', 'loadingCellRendererSelector', 'getRowId', 'groupAggFiltering'
    ];

    public static FUNCTION_PROPERTIES: GridOptionKey[] = [
        ...PropertyKeys.FUNCTIONAL_PROPERTIES,
        ...PropertyKeys.CALLBACK_PROPERTIES
    ];

    public static ALL_PROPERTIES: GridOptionKey[] = [
        ...PropertyKeys.ARRAY_PROPERTIES,
        ...PropertyKeys.OBJECT_PROPERTIES,
        ...PropertyKeys.STRING_PROPERTIES,
        ...PropertyKeys.NUMBER_PROPERTIES,
        ...PropertyKeys.FUNCTION_PROPERTIES,
        ...PropertyKeys.BOOLEAN_PROPERTIES
    ];
}
