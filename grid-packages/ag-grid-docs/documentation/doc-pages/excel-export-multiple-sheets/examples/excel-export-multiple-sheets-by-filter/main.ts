import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';

const columnDefs: ColDef[] = [
  { field: 'athlete', minWidth: 200 },
  { field: 'age' },
  { field: 'country', minWidth: 200 },
  { field: 'year' },
  { field: 'date', minWidth: 150 },
  { field: 'sport', minWidth: 150 },
  { field: 'gold' },
  { field: 'silver' },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    filter: true,
    minWidth: 100,
    flex: 1,
  },

  columnDefs: columnDefs,
}

function onBtExport() {
  var sports: Record<string, boolean> = {}

  gridApi!.forEachNode(function (node) {
    if (!sports[node.data!.sport]) {
      sports[node.data!.sport] = true
    }
  })

  var spreadsheets = []

  var sportFilterInstance = gridApi!.getFilterInstance('sport')!

  for (var sport in sports) {
    sportFilterInstance.setModel({ values: [sport] })
    gridApi!.onFilterChanged()

    if (sportFilterInstance.getModel() == null) {
      throw new Error('Example error: Filter not applied');
    }

    const sheet = gridApi!.getSheetDataForExcel({
      sheetName: sport,
    });
    if (sheet) {
      spreadsheets.push(sheet)
    }
  }

  sportFilterInstance.setModel(null)
  gridApi!.onFilterChanged()

  gridApi!.exportMultipleSheetsAsExcel({
    data: spreadsheets,
    fileName: 'ag-grid.xlsx',
  })

  spreadsheets = []
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
