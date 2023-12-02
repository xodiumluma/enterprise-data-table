import {
  ColDef,
  ColGroupDef,
  FirstDataRenderedEvent,
  GridApi,
  createGrid,
  GridOptions,
  ITooltipParams,
} from '@ag-grid-community/core';
import { CustomTooltip } from "./customTooltip_typescript";

const tooltipValueGetter = (params: ITooltipParams) => ({ value: params.value })

const columnDefs: (ColDef | ColGroupDef)[] = [
  {
    headerName: 'Athletes',
    headerTooltip: 'Athletes',
    tooltipComponent: CustomTooltip,
    children: [
      {
        headerName: 'Athlete Col 1',
        field: 'athlete',
        minWidth: 150,
        headerTooltip: 'Athlete 1',
        tooltipField: 'athlete',
      },
      {
        headerName: 'Athlete Col 2',
        field: 'athlete',
        minWidth: 150,
        headerTooltip: 'Athlete 2',
        tooltipComponent: CustomTooltip,
        tooltipValueGetter: tooltipValueGetter,
      },
    ],
  },
  { field: 'sport', width: 110 },
  { field: 'gold', width: 100 },
  { field: 'silver', width: 100 },
  { field: 'bronze', width: 100 },
  { field: 'total', width: 100 },
]

let gridApi: GridApi;

const gridOptions: GridOptions = {
  defaultColDef: {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  },

  // set rowData to null or undefined to show loading panel by default
  rowData: null,
  columnDefs: columnDefs,

  onFirstDataRendered: onFirstDataRendered,
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  params.api.getDisplayedRowAtIndex(0)!.data.athlete = undefined
  params.api.getDisplayedRowAtIndex(1)!.data.athlete = null
  params.api.getDisplayedRowAtIndex(2)!.data.athlete = ''

  params.api.refreshCells()
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
