import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'athlete', minWidth: 150 },
    { field: 'age', maxWidth: 90 },
    { field: 'country', minWidth: 150 },
    { field: 'year', maxWidth: 90 },
    { field: 'date', minWidth: 150 },
    { field: 'sport', minWidth: 150 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  rowSelection: 'multiple',
  onSelectionChanged: onSelectionChanged,
}

function onSelectionChanged() {
  var selectedRows = gridApi!.getSelectedRows()
  var selectedRowsString = ''
  var maxToShow = 5

  selectedRows.forEach(function (selectedRow, index) {
    if (index >= maxToShow) {
      return
    }

    if (index > 0) {
      selectedRowsString += ', '
    }

    selectedRowsString += selectedRow.athlete
  })

  if (selectedRows.length > maxToShow) {
    var othersCount = selectedRows.length - maxToShow
    selectedRowsString +=
      ' and ' + othersCount + ' other' + (othersCount !== 1 ? 's' : '')
  }

  (document.querySelector('#selectedRows') as any).innerHTML = selectedRowsString
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
