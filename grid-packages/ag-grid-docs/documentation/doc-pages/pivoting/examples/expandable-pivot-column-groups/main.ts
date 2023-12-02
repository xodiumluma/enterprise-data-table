import { GridApi, createGrid, GridOptions, ColumnGroup } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'country', rowGroup: true, enableRowGroup: true },
    { field: 'athlete' },
    { field: 'sport', pivot: true, enablePivot: true },
    { field: 'year', pivot: true, enablePivot: true },
    { field: 'date', pivot: true, enablePivot: true },
    { field: 'gold', aggFunc: 'sum' },
    { field: 'silver', aggFunc: 'sum' },
    { field: 'bronze', aggFunc: 'sum' },
  ],
  defaultColDef: {
    maxWidth: 140,
    filter: true,
  },
  autoGroupColumnDef: {
    minWidth: 180,
  },
  pivotMode: true,
}

function expandAll(expand: boolean) {
  const state = gridApi!.getColumnGroupState();
  const expandedState = state.map((group) => ({
    groupId: group.groupId,
    open: expand,
  }));
  gridApi!.setColumnGroupState(expandedState);
}

function expandRoute(route: string[]) {
  const expand = (columnGroup: ColumnGroup) => {
    if (columnGroup) {
      expand(columnGroup.getParent());
      gridApi!.setColumnGroupOpened(columnGroup.getGroupId(), true);
    }
  }

  const targetCol = gridApi!.getPivotResultColumn(route, 'gold');
  if (targetCol) {
    expand(targetCol.getParent());
  }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
