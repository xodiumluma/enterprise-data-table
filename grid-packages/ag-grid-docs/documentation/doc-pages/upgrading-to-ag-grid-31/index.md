---
title: "Upgrading to AG Grid 31"
---

## What's New

See the [release post](https://blog.ag-grid.com/whats-new-in-ag-grid-31/) for details of what's new in this major version.

## Codemods

Follow these steps to upgrade your project's AG Grid version to `31.0.0`:

1. Open a terminal and navigate to your project's root folder.

2. Update any AG Grid dependencies listed in your project's `package.json` to version `31.0.0`.

3. Run the `migrate` command of version `31.0` of the AG Grid codemod runner:

    ```
    npx @ag-grid-community/cli@31.0 migrate
    ```

    This will update your project's source files to prepare for the new release.

    By default the Codemod runner will locate all source files within the current directory. For projects with more specific requirements, pass a list of input files to the `migrate` command, or specify the `--help` argument to see more fine-grained usage instructions.

<note>
The Codemod runner will check the state of your project to ensure that you don't lose any work. If you would rather see a diff of the changes instead of applying them, pass the `--dry-run` argument.
</note>

See the [Codemods](/codemods/) documentation for more details.

## Breaking Changes

This release includes the following breaking changes:

### React

* `AgGridReactFire` is no longer exported from `ag-grid-react`. You should use `AgGridReact` instead.
* The loading overlay is now displayed for all row models if column definitions are not provided when the grid is initialised. The rows will also not be created and rendered until the column definitions are provided.
* Validation is now run when `gridOptions` are updated, meaning warnings may appear in console when changing grid options if an invalid configuration is reached.
* Auto-generated group row IDs when using Client-Side Row Model now have a different format (but the same prefix).<br>`rowDataUpdated` event is only fired for the Client-Side Row Model (per the existing documentation)."
* Legacy React Rendering, enabled via `suppressReactUi` property is deprecated since v28 and is now removed.<br>AG Grid now only renders via React components as has been the default since v28.
* `rowDataChangeDetectionStrategy` - removed. identity / reference equals always used.

### Integrated Charts

The `solar` and `pastel` integrated chart themes have been removed. Any saved chart models will be migrated to the new `polychroma` and `sheets` themes respectively. If you're using themeOverrides, see charts migration page as the structure and naming of options have changed.

If you are using Standalone Charts, please see changes to charts in the [AG Charts Migration Guide](https://charts.ag-grid.com/react/upgrade-to-ag-charts-9/).

### ColDef

Grid columns are now sortable and resizable by default. Also, the grid animates rows by default. In order to avoid this, please set `defaultColDef.resizable = false`, `defaultColDef.sortable = false` and `gridOptions.animateRows = false`.

### GridOptions

* Javascript - Mutating `gridOptions` after the grid has been created will no longer be picked up by the grid. Instead use `api.setGridOption` (`property`, `newValue`) to update grid options.
* Validation is now run when `gridOptions` are updated, meaning warnings may appear in console when changing grid options if an invalid configuration is reached.
* `serverSideStoreType` - removed, use `suppressServerSideInfiniteScroll` instead. When false, Partial Store is used. When true, Full Store is used.
* `serverSideSortingAlwaysResets` - removed, use `serverSideSortAllLevels` instead.
* `serverSideFilteringAlwaysResets` - removed, use `serverSideOnlyRefreshFilteredGroups` instead.
* `processSecondaryColDef` - removed, use `processPivotResultColDef` instead.
* `processSecondaryColGroupDef` - removed, use `processPivotResultColGroupDef` instead.
* `getServerSideStoreParams` - removed, use `getServerSideGroupLevelParams` instead.
* `onRowDataChanged`: no longer fired, use `onRowDataUpdated` instead.
* `getRowId` is now an initial property and can no longer be updated.
* `rememberGroupStateWhenNewData` - removed. Provide getRowId to maintain group state when row data updated instead (see [Updating Row Data](/data-update-row-data/)).

### Column Filters

* `IServerSideGetRowsRequest.filterModel` can now be of type AdvancedFilterModel | null if Advanced Filter is enabled, or FilterModel otherwise (for Column Filters).
* Added new localisation keys for the Date Filter - `lessThan` is now `before`, and `greaterThan` is now `after`. Please provide translations for these 2 new keys in your localized dictionaries to display your translation instead of the English strings for "before" and "after".

### Row Grouping

* Group values will no longer be typeless, and will be inferred from the first row when they were created.
* When using row grouping with `groupDisplayType=singleColumn` (which is the default behavior) and displaying checkboxes in the auto-group column, checkboxes in leaf rows are only displayed if `autoGroupColumnDef` provides a field or a valueGetter to show values in leaf row cells. If you'd like to show checkboxes in the group columns for leaf rows, provide a field or valueGetter in the `autoGroupColumnDef`.

### Pagination

When showing the pagination controls, the page size selector is shown by default. You can prevent this by setting `paginationPageSizeSelector=false`.

### Sever-Side Row Model

* `ServerSideGroupLevelParams.storeType` - removed, use `suppressInfiniteScroll` instead. When false, Partial Store is used. When true, Full Store is used.
* `IsApplyServerSideTransactionParams.storeInfo` - removed, use `IsApplyServerSideTransactionParams.groupLevelInfo` instead.
* `LoadSuccessParams.storeInfo` - removed, use `LoadSuccessParams.groupLevelInfo` instead.
* `IServerSideGetRowsParams.successCallback` - removed, use `success` method with `LoadSuccessParams` params instead.
* `IServerSideGetRowsParams.failCallback` - removed, use `fail` instead.
* interface `ServerSideStoreParams` - removed, use `ServerSideGroupLevelParams` instead.
* interface `GetServerSideStoreParamsParams` - removed, use `GetServerSideGroupLevelParamsParams` instead.
* interface `RefreshStoreParams` - removed, use `RefreshServerSideParams` instead.
* interface `ServerSideGroupState` - removed, use `ServerSideGroupLevelState` instead.

### Export

* `ExcelExportParams` no longer have the following options (removed without replacement due to removing support for export as XML):
    * `exportMode`
    * `suppressTextAsCDATA`
* `columnGroups`: groups are exported by default.
* `skipGroups` - removed, use `skipRowGroups` instead.
* `skipHeader` - removed, use `skipColumnHeaders` instead.
* `customFooter` - removed, use `appendContent` instead.
* `customHeader` - removed, use `prependContent` instead.
* interface `RangeSelection` - removed, use `CellRange` instead.
* interface `AddRangeSelectionParams` - removed, use `CellRangeParams` instead.

### Column API

* `getAllColumns` - removed, use `api.getColumns` instead.
* `getPrimaryColumns` - removed, use `api.getColumns` instead.
* `getSecondaryColumns` - removed, use `api.getPivotResultColumns` instead.
* `setSecondaryColumns` - removed, use `api.setPivotResultColumns` instead.
* `getSecondaryPivotColumn` - removed, use `api.getPivotResultColumn` instead.

### Grid API

* `refreshServerSideStore` - removed, use `refreshServerSide` instead.
* `getServerSideStoreState` - removed, use `getServerSideGroupLevelState` instead.
* `setProcessSecondaryColDef` - removed, use `api.setGridOption`(`processPivotResultColDef`, `newValue`) instead.
* `setProcessSecondaryColGroupDef` - removed, use `api.setGridOption`(`setProcessPivotResultColGroupDef`, `newValue`) instead.
* `setGetServerSideStoreParams` - removed, use `api.setGridOption`(`getServerSideGroupLevelParams`, `newValue`) instead.

## Deprecations

This release includes the following deprecations:

### GridOptions

* `advancedFilterModel` - deprecated, use `initialState.filter.advancedFilterModel` instead.
* `suppressAsyncEvents` and synchronous event handling is deprecated. Please update your events to be handled asynchronously.

### Column Filters

`IFilterParams.valueGetter` - deprecated, use `IFilterParams.getValue` instead.

### Column API

Column API is now deprecated. Column API methods are now available in [Grid API](/grid-api/) instead.

### Grid API

* `setGetRowId` is now deprecated because `getRowId` can no longer be updated (listed as a breaking change above).

* The Grid API methods listed below have been deprecated. Please use Grid API methods `setGridOption` and `updateGridOptions` to set properties instead as described in [Updating Grid Options](/grid-interface/#updating-grid-options/).

    * `setPivotMode`
    * `setPinnedTopRowData`
    * `setPinnedBottomRowData`
    * `setPopupParent`
    * `setSuppressModelUpdateAfterUpdateTransaction`
    * `setDataTypeDefinitions`
    * `setPagination`
    * `paginationSetPageSize`
    * `setSideBar`
    * `setSuppressClipboardPaste`
    * `setGroupRemoveSingleChildren`
    * `setGroupRemoveLowestSingleChildren`
    * `setGroupDisplayType`
    * `setGroupIncludeFooter`
    * `setGroupIncludeTotalFooter`
    * `setRowClass`
    * `setDeltaSort`
    * `setSuppressRowDrag`
    * `setSuppressMoveWhenRowDragging`
    * `setSuppressRowClickSelection`
    * `setEnableAdvancedFilter`
    * `setIncludeHiddenColumnsInAdvancedFilter`
    * `setAdvancedFilterParent`
    * `setAdvancedFilterBuilderParams`
    * `setQuickFilter`
    * `setExcludeHiddenColumnsFromQuickFilter`
    * `setIncludeHiddenColumnsInQuickFilter`
    * `setQuickFilterParser`
    * `setQuickFilterMatcher`
    * `setAlwaysShowHorizontalScroll`
    * `setAlwaysShowVerticalScroll`
    * `setFunctionsReadOnly`
    * `setColumnDefs`
    * `setAutoGroupColumnDef`
    * `setDefaultColDef`
    * `setColumnTypes`
    * `setTreeData`
    * `setServerSideDatasource`
    * `setCacheBlockSize`
    * `setDatasource`
    * `setViewportDatasource`
    * `setRowData`
    * `setEnableCellTextSelection`
    * `setHeaderHeight`
    * `setDomLayout`
    * `setFillHandleDirection`
    * `setGroupHeaderHeight`
    * `setFloatingFiltersHeight`
    * `setPivotHeaderHeight`
    * `setPivotGroupHeaderHeight`
    * `setAnimateRows`
    * `setIsExternalFilterPresent`
    * `setDoesExternalFilterPass`
    * `setNavigateToNextCell`
    * `setTabToNextCell`
    * `setTabToNextHeader`
    * `setNavigateToNextHeader`
    * `setRowGroupPanelShow`
    * `setGetGroupRowAgg`
    * `setGetBusinessKeyForNode`
    * `setGetChildCount`
    * `setProcessRowPostCreate`
    * `setGetRowClass`
    * `setIsFullWidthRow`
    * `setIsRowSelectable`
    * `setIsRowMaster`
    * `setPostSortRows`
    * `setGetDocument`
    * `setGetContextMenuItems`
    * `setGetMainMenuItems`
    * `setProcessCellForClipboard`
    * `setSendToClipboard`
    * `setProcessCellFromClipboard`
    * `setProcessPivotResultColDef`
    * `setProcessPivotResultColGroupDef`
    * `setPostProcessPopup`
    * `setInitialGroupOrderComparator`
    * `setGetChartToolbarItems`
    * `setPaginationNumberFormatter`
    * `setGetServerSideGroupLevelParams`
    * `setIsServerSideGroupOpenByDefault`
    * `setIsApplyServerSideTransaction`
    * `setIsServerSideGroup`
    * `setGetServerSideGroupKey`
    * `setGetRowStyle`
    * `setGetRowHeight`

## Changes List

If you would like to see the full list of changes in this release, please see the [Changelog](https://www.ag-grid.com/changelog/?fixVersion=31.0.0).
