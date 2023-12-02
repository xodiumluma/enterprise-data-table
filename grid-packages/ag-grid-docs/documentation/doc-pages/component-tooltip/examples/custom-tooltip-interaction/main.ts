import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';
import { CustomTooltip } from "./customTooltip_typescript";

const columnDefs: ColDef[] = [
  {
    field: 'athlete',
    minWidth: 150,
    tooltipField: 'athlete',
    tooltipComponentParams: { type: 'success' },
  },
  { field: 'age' },
  { field: 'country', minWidth: 130, tooltipField: 'country' },
  { field: 'year' },
  { field: 'date' },
  { field: 'sport' },
  { field: 'gold' },
  { field: 'silver' },
  { field: 'bronze' },
  { field: 'total' },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    tooltipComponent: CustomTooltip
  },

  tooltipInteraction: true,

  // set rowData to null or undefined to show loading panel by default
  rowData: null,
  columnDefs: columnDefs,
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
