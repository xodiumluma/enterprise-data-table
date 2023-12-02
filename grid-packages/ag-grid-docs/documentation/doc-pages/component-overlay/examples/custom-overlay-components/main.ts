import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';
import { CustomLoadingOverlay } from './customLoadingOverlay_typescript';
import { CustomNoRowsOverlay } from './customNoRowsOverlay_typescript';

const columnDefs: ColDef[] = [
  { field: 'athlete', width: 150 },
  { field: 'age', width: 90 },
  { field: 'country', width: 120 },
  { field: 'year', width: 90 },
  { field: 'date', width: 110 },
  { field: 'sport', width: 110 },
  { field: 'gold', width: 100 },
  { field: 'silver', width: 100 },
  { field: 'bronze', width: 100 },
  { field: 'total', width: 100 },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  },

  // set rowData to null or undefined to show loading panel by default
  rowData: null,
  columnDefs: columnDefs,

  loadingOverlayComponent: CustomLoadingOverlay,
  loadingOverlayComponentParams: {
    loadingMessage: 'One moment please...',
  },
  noRowsOverlayComponent: CustomNoRowsOverlay,
  noRowsOverlayComponentParams: {
    noRowsMessageFunc: () => 'No rows found at: ' + new Date().toLocaleTimeString(),
  },
}

function onBtShowLoading() {
  gridApi!.showLoadingOverlay()
}

function onBtShowNoRows() {
  gridApi!.showNoRowsOverlay()
}

function onBtHide() {
  gridApi!.hideOverlay()
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(data => {
      gridApi!.setGridOption('rowData', data)
    })
})
