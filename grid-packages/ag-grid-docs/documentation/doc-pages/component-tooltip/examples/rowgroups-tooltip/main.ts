import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';

const columnDefs: ColDef[] = [
  { field: 'country', width: 120, rowGroup: true },
  { field: 'year', width: 90, rowGroup: true },
  { field: 'sport', width: 110 },
  { field: 'athlete', width: 200 },
  { field: 'gold', width: 100 },
  { field: 'silver', width: 100 },
  { field: 'bronze', width: 100 },
  { field: 'total', width: 100 },
  { field: 'age', width: 90 },
  { field: 'date', width: 110 },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  autoGroupColumnDef: {
    headerTooltip: 'Group',
    minWidth: 190,
    tooltipValueGetter: params => {
      const count = params.node && params.node.allChildrenCount

      if (count != null) {
        return params.value + ' (' + count + ')'
      }

      return params.value
    },
  },
  defaultColDef: {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  },
  columnDefs: columnDefs,
  rowData: null,
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
