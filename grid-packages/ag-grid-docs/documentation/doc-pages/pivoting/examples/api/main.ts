import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    {
      field: 'athlete',
      enableRowGroup: true,
      enablePivot: true,
      minWidth: 200,
    },
    { field: 'age', enableValue: true },
    { field: 'country', enableRowGroup: true, enablePivot: true },
    { field: 'year', enableRowGroup: true, enablePivot: true },
    { field: 'date', enableRowGroup: true, enablePivot: true },
    { field: 'sport', enableRowGroup: true, enablePivot: true, minWidth: 200 },
    { field: 'gold', enableValue: true, aggFunc: 'sum' },
    { field: 'silver', enableValue: true },
    { field: 'bronze', enableValue: true },
    { field: 'total', enableValue: true },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 150,
    filter: true,
  },
  autoGroupColumnDef: {
    minWidth: 250,
  },
  sideBar: true,
}

function turnOffPivotMode() {
  gridApi!.setGridOption('pivotMode', false)
}

function turnOnPivotMode() {
  gridApi!.setGridOption('pivotMode', true)
}

function addPivotColumn() {
  gridApi!.applyColumnState({
    state: [{ colId: 'country', pivot: true }],
    defaultState: { pivot: false },
  })
}

function addPivotColumns() {
  gridApi!.applyColumnState({
    state: [
      { colId: 'year', pivot: true },
      { colId: 'country', pivot: true },
    ],
    defaultState: { pivot: false },
  })
}

function removePivotColumn() {
  gridApi!.applyColumnState({
    state: [{ colId: 'country', pivot: false }],
  })
}

function emptyPivotColumns() {
  gridApi!.applyColumnState({
    defaultState: { pivot: false },
  })
}

function exportToCsv() {
  gridApi!.exportDataAsCsv()
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
