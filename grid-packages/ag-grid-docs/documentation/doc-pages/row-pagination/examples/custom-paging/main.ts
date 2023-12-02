import {
  GridApi,
  createGrid,
  CheckboxSelectionCallbackParams,
  ColDef,
  FirstDataRenderedEvent,
  GridOptions,
  HeaderCheckboxSelectionCallbackParams,
  IGroupCellRendererParams,
  ValueGetterParams,
  PaginationNumberFormatterParams,
} from '@ag-grid-community/core';

var checkboxSelection = function (params: CheckboxSelectionCallbackParams) {
  // we put checkbox on the name if we are not doing grouping
  return params.api.getRowGroupColumns().length === 0
}
var headerCheckboxSelection = function (params: HeaderCheckboxSelectionCallbackParams) {
  // we put checkbox on the name if we are not doing grouping
  return params.api.getRowGroupColumns().length === 0
}
const columnDefs: ColDef[] = [
  {
    headerName: 'Athlete',
    field: 'athlete',
    minWidth: 170,
    checkboxSelection: checkboxSelection,
    headerCheckboxSelection: headerCheckboxSelection,
  },
  { field: 'age' },
  { field: 'country' },
  { field: 'year' },
  { field: 'date' },
  { field: 'sport' },
  { field: 'gold' },
  { field: 'silver' },
  { field: 'bronze' },
  { field: 'total' },
]

var autoGroupColumnDef: ColDef = {
  headerName: 'Group',
  minWidth: 170,
  field: 'athlete',
  valueGetter: (params) => {
    if (params.node!.group) {
      return params.node!.key
    } else {
      return params.data[params.colDef.field!]
    }
  },
  headerCheckboxSelection: true,
  cellRenderer: 'agGroupCellRenderer',
  cellRendererParams: {
    checkbox: true,
  } as IGroupCellRendererParams,
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    editable: true,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  },
  suppressRowClickSelection: true,
  groupSelectsChildren: true,
  // debug: true,
  rowSelection: 'multiple',
  rowGroupPanelShow: 'always',
  pivotPanelShow: 'always',
  columnDefs: columnDefs,
  pagination: true,
  paginationPageSize: 500,
  paginationPageSizeSelector: [200, 500, 1000],
  autoGroupColumnDef: autoGroupColumnDef,
  onFirstDataRendered: onFirstDataRendered,
  paginationNumberFormatter: (params: PaginationNumberFormatterParams) => {
    return '[' + params.value.toLocaleString() + ']'
  },
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  params.api.paginationGoToPage(4)
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(function (data) {
      gridApi!.setGridOption('rowData', data)
    })
})
