import { GridApi, createGrid, GridOptions, ISetFilterParams } from '@ag-grid-community/core';

var filterParams: ISetFilterParams = {
  comparator: (a: string | null, b: string | null) => {
    var valA = a == null ? 0 : parseInt(a);
    var valB = b == null ? 0 : parseInt(b);
    if (valA === valB) return 0;
    return valA > valB ? 1 : -1;
  },
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    {
      headerName: 'Age (No Comparator)',
      field: 'age',
      filter: 'agSetColumnFilter',
    },
    {
      headerName: 'Age (With Comparator)',
      field: 'age',
      filter: 'agSetColumnFilter',
      filterParams: filterParams,
    },
  ],
  defaultColDef: {
    flex: 1,
    filter: true,
    cellDataType: false,
  },
  rowData: getRowData(),
  sideBar: 'filters',
  onGridReady: (params) => {
    params.api.getToolPanelInstance('filters')!.expandFilters();
  },
}

function getRowData() {
  var rows = []
  for (var i = 1; i < 117; i++) {
    rows.push({ age: i })
  }
  return rows
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
