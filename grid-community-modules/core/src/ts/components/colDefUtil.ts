import { ColDef, ColGroupDef } from "../entities/colDef";

type ColKey = keyof (ColDef) | (keyof ColGroupDef);

export class ColDefUtil {

    private static ColDefPropertyMap: Record<ColKey, undefined> = {
        headerName: undefined,
        columnGroupShow: undefined,
        headerClass: undefined,
        toolPanelClass: undefined,
        headerValueGetter: undefined,
        pivotKeys: undefined,
        groupId: undefined,
        colId: undefined,
        sort: undefined,
        initialSort: undefined,
        field: undefined,
        type: undefined,
        cellDataType: undefined,
        tooltipComponent: undefined,
        tooltipField: undefined,
        headerTooltip: undefined,
        cellClass: undefined,
        showRowGroup: undefined,
        filter: undefined,
        initialAggFunc: undefined,
        defaultAggFunc: undefined,
        aggFunc: undefined,
        pinned: undefined,
        initialPinned: undefined,
        chartDataType: undefined,
        cellAriaRole: undefined,
        cellEditorPopupPosition: undefined,
        headerGroupComponent: undefined,
        headerGroupComponentParams: undefined,
        cellStyle: undefined,
        cellRenderer: undefined,
        cellRendererParams: undefined,
        cellEditor: undefined,
        cellEditorParams: undefined,
        filterParams: undefined,
        pivotValueColumn: undefined,
        headerComponent: undefined,
        headerComponentParams: undefined,
        floatingFilterComponent: undefined,
        floatingFilterComponentParams: undefined,
        tooltipComponentParams: undefined,
        refData: undefined,
        columnsMenuParams: undefined,
        children: undefined,
        sortingOrder: undefined,
        allowedAggFuncs: undefined,
        menuTabs: undefined,
        pivotTotalColumnIds: undefined,
        cellClassRules: undefined,
        icons: undefined,
        sortIndex: undefined,
        initialSortIndex: undefined,
        flex: undefined,
        initialFlex: undefined,
        width: undefined,
        initialWidth: undefined,
        minWidth: undefined,
        maxWidth: undefined,
        rowGroupIndex: undefined,
        initialRowGroupIndex: undefined,
        pivotIndex: undefined,
        initialPivotIndex: undefined,
        suppressCellFlash: undefined,
        suppressColumnsToolPanel: undefined,
        suppressFiltersToolPanel: undefined,
        openByDefault: undefined,
        marryChildren: undefined,
        suppressStickyLabel: undefined,
        hide: undefined,
        initialHide: undefined,
        rowGroup: undefined,
        initialRowGroup: undefined,
        pivot: undefined,
        initialPivot: undefined,
        checkboxSelection: undefined,
        showDisabledCheckboxes: undefined,
        headerCheckboxSelection: undefined,
        headerCheckboxSelectionFilteredOnly: undefined,
        headerCheckboxSelectionCurrentPageOnly: undefined,
        suppressMenu: undefined,
        suppressMovable: undefined,
        lockPosition: undefined,
        lockVisible: undefined,
        lockPinned: undefined,
        unSortIcon: undefined,
        suppressSizeToFit: undefined,
        suppressAutoSize: undefined,
        enableRowGroup: undefined,
        enablePivot: undefined,
        enableValue: undefined,
        editable: undefined,
        suppressPaste: undefined,
        suppressNavigable: undefined,
        enableCellChangeFlash: undefined,
        rowDrag: undefined,
        dndSource: undefined,
        autoHeight: undefined,
        wrapText: undefined,
        sortable: undefined,
        resizable: undefined,
        singleClickEdit: undefined,
        floatingFilter: undefined,
        cellEditorPopup: undefined,
        suppressFillHandle: undefined,
        wrapHeaderText: undefined,
        autoHeaderHeight: undefined,
        dndSourceOnRowDrag: undefined,
        valueGetter: undefined,
        valueSetter: undefined,
        filterValueGetter: undefined,
        keyCreator: undefined,
        valueFormatter: undefined,
        valueParser: undefined,
        comparator: undefined,
        equals: undefined,
        pivotComparator: undefined,
        suppressKeyboardEvent: undefined,
        suppressHeaderKeyboardEvent: undefined,
        colSpan: undefined,
        rowSpan: undefined,
        getQuickFilterText: undefined,
        onCellValueChanged: undefined,
        onCellClicked: undefined,
        onCellDoubleClicked: undefined,
        onCellContextMenu: undefined,
        rowDragText: undefined,
        tooltipValueGetter: undefined,
        cellRendererSelector: undefined,
        cellEditorSelector: undefined,
        suppressSpanHeaderHeight: undefined,
        useValueFormatterForExport: undefined,
        useValueParserForImport: undefined,
    };

    public static ALL_PROPERTIES: ColKey[] = Object.keys(ColDefUtil.ColDefPropertyMap) as ColKey[];
}
