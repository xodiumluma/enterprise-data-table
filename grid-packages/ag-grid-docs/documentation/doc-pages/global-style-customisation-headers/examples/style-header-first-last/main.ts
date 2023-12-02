import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { 
      headerName: 'Athlete Details',
      children: [
        { field: 'athlete' },
        { field: 'age', maxWidth: 120 },
        { field: 'country' },
      ]
    },
    { field: 'year', maxWidth: 100 },
    { 
      headerName: 'Sport Details',
      children: [
        { field: 'total', columnGroupShow: 'closed' },
        { field: 'gold', columnGroupShow: 'open' },
        { field: 'silver', columnGroupShow: 'open' },
        { field: 'bronze', columnGroupShow: 'open' },
      ]
    },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 150,
    filter: true,
    floatingFilter: true
  },
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
