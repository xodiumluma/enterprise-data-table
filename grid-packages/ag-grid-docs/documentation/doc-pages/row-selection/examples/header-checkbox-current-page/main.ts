import {
  GridApi,
  createGrid,
  GridOptions,
  IGroupCellRendererParams,
  IsGroupOpenByDefaultParams,
} from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'country', rowGroup: true, hide: true },
    { field: 'sport', rowGroup: true, hide: true },
    { field: 'gold', aggFunc: 'sum' },
    { field: 'silver', aggFunc: 'sum' },
    { field: 'bronze', aggFunc: 'sum' },
    { field: 'age', minWidth: 120, checkboxSelection: true },
    { field: 'year', maxWidth: 120 },
    { field: 'date', minWidth: 150 },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  autoGroupColumnDef: {
    headerName: 'Athlete',
    field: 'athlete',
    minWidth: 250,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      checkbox: true,
    } as IGroupCellRendererParams,
    headerCheckboxSelection: true,
    headerCheckboxSelectionCurrentPageOnly: true,
  },
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  suppressAggFuncInHeader: true,

  pagination: true,
  paginationAutoPageSize: true,
  paginateChildRows: true,

  isGroupOpenByDefault: isGroupOpenByDefault,
}

function isGroupOpenByDefault(params: IsGroupOpenByDefaultParams<IOlympicData, any>) {
  return params.key === 'Australia' || params.key === 'Swimming';
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
