import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';

let gridApi: GridApi;

const gridOptions: GridOptions = {
  defaultColDef: {
    editable: true,
    minWidth: 100,
    flex: 1,
  },

  suppressExcelExport: true,
  popupParent: document.body,

  columnDefs: [{ field: 'make' }, { field: 'model' }, { field: 'price' }],

  rowData: [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 },
  ],
}

function getValue(inputSelector: string) {
  var text = (document.querySelector(inputSelector) as any).value
  switch (text) {
    case 'none':
      return
    case 'tab':
      return '\t'
    default:
      return text
  }
}

function getParams() {
  return {
    columnSeparator: getValue('#columnSeparator'),
  }
}

function onBtnExport() {
  var params = getParams()
  if (params.columnSeparator) {
    alert(
      'NOTE: you are downloading a file with non-standard separators - it may not render correctly in Excel.'
    )
  }
  gridApi!.exportDataAsCsv(params)
}

function onBtnUpdate() {
  (document.querySelector('#csvResult') as any).value = gridApi!.getDataAsCsv(
    getParams()
  )
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
