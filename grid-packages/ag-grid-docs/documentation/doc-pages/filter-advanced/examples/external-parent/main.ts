import { GridApi, createGrid, GridOptions, GridReadyEvent } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'athlete' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'age', minWidth: 100 },
    { field: 'gold', minWidth: 100 },
    { field: 'silver', minWidth: 100 },
    { field: 'bronze', minWidth: 100 },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 180,
    filter: true,
  },
  enableAdvancedFilter: true,
  popupParent: document.getElementById('wrapper'),
  onGridReady: (params: GridReadyEvent) => {
    // could also be provided via grid option `advancedFilterParent`
    params.api.setGridOption('advancedFilterParent', document.getElementById('advancedFilterParent'));
  }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
