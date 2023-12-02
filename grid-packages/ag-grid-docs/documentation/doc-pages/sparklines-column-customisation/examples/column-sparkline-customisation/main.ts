import { ColumnSparklineOptions, GridApi, createGrid, GridOptions } from '@ag-grid-community/core';
import { getData } from "./data";


let gridApi: GridApi;


const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'symbol', maxWidth: 120 },
    { field: 'name', minWidth: 250 },
    {
      field: 'change',
      cellRenderer: 'agSparklineCellRenderer',
      cellRendererParams: {
        sparklineOptions: {
          type: 'column',
          fill: '#91cc75',
          stroke: '#91cc75',
          highlightStyle: {
            fill: 'orange',
          },
          paddingInner: 0.3,
          paddingOuter: 0.1,
        } as ColumnSparklineOptions,
      },
    },
    {
      field: 'volume',
      type: 'numericColumn',
      maxWidth: 140,
    },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  rowData: getData(),
  rowHeight: 50,
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
