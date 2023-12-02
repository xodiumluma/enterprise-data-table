import {
  GridApi,
  createGrid,
  ColDef,
  GridOptions,
  ICellRendererComp,
  ICellRendererParams,
  IViewportDatasource,
  ValueFormatterParams,
  GetRowIdParams,
} from '@ag-grid-community/core';
declare function createMockServer(): any;
declare function createViewportDatasource(mockServer: any): IViewportDatasource;

class RowIndexRenderer implements ICellRendererComp {
  eGui!: HTMLDivElement;
  init(params: ICellRendererParams) {
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = '' + params.node.rowIndex;

  }
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  getGui(): HTMLElement {
    return this.eGui;
  }
}

const columnDefs: ColDef[] = [
  // this col shows the row index, doesn't use any data from the row
  {
    headerName: '#',
    maxWidth: 80,
    cellRenderer: RowIndexRenderer,
  },
  { field: 'code', maxWidth: 90 },
  { field: 'name', minWidth: 220 },
  {
    field: 'bid',
    cellClass: 'cell-number',
    valueFormatter: numberFormatter,
    cellRenderer: 'agAnimateShowChangeCellRenderer',
  },
  {
    field: 'mid',
    cellClass: 'cell-number',
    valueFormatter: numberFormatter,
    cellRenderer: 'agAnimateShowChangeCellRenderer',
  },
  {
    field: 'ask',
    cellClass: 'cell-number',
    valueFormatter: numberFormatter,
    cellRenderer: 'agAnimateShowChangeCellRenderer',
  },
  {
    field: 'volume',
    cellClass: 'cell-number',
    cellRenderer: 'agAnimateSlideCellRenderer',
  },
]

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: columnDefs,
  defaultColDef: {
    flex: 1,
    minWidth: 140,
    sortable: false,
  },
  rowSelection: 'multiple',
  rowModelType: 'viewport',
  // implement this so that we can do selection
  getRowId: (params: GetRowIdParams) => {
    // the code is unique, so perfect for the id
    return params.data.code
  },
  // debug: true
}

function numberFormatter(params: ValueFormatterParams) {
  if (typeof params.value === 'number') {
    return params.value.toFixed(2)
  } else {
    return params.value
  }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);


  fetch('https://www.ag-grid.com/example-assets/stocks.json')
    .then(response => response.json())
    .then(function (data) {
      // set up a mock server - real code will not do this, it will contact your
      // real server to get what it needs
      var mockServer = createMockServer()
      mockServer.init(data)

      var viewportDatasource = createViewportDatasource(mockServer)
      gridApi!.setGridOption('viewportDatasource', viewportDatasource)
    })
})



