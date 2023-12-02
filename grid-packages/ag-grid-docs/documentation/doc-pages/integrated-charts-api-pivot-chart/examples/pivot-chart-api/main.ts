import {createGrid, FirstDataRenderedEvent, GridApi, GridOptions,} from '@ag-grid-community/core';

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'country', pivot: true },
    { field: 'year', rowGroup: true },
    { field: 'sport', rowGroup: true },
    { field: 'total', aggFunc: 'sum' },
    { field: 'gold', aggFunc: 'sum' },
  ],
  defaultColDef: {
    editable: true,
    flex: 1,
    minWidth: 130,
    filter: true,
  },
  autoGroupColumnDef: {
    minWidth: 200,
  },
  pivotMode: true,
  onFirstDataRendered,
  popupParent: document.body,
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  params.api.createPivotChart( {
    chartType: 'groupedColumn',
    chartContainer: document.querySelector('#myChart') as HTMLElement,
    chartThemeOverrides: {
      common: {
        navigator: {
          enabled: true,
          height: 10,
        },
      },
    },
  });

  // expand one row for demonstration purposes
  setTimeout( () => params.api.getDisplayedRowAtIndex(2)!.setExpanded(true), 0);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/wide-spread-of-sports.json')
    .then(response => response.json())
    .then(function (data) {
      gridApi!.setGridOption('rowData', data)
    })
})
