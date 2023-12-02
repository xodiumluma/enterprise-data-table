import { GridApi, createGrid, GridOptions, IRowNode } from '@ag-grid-community/core';

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
  rowData: null,
}

function selectAllAmerican() {
  const selected: IRowNode[] = [];
  const deselected: IRowNode[] = [];
  gridApi!.forEachNode(function (node) {
    if (node.data!.country === 'United States') {
      selected.push(node);
    } else {
      deselected.push(node);
    }
  });
  gridApi!.setNodesSelected({ nodes: selected, newValue: true });
  gridApi!.setNodesSelected({ nodes: deselected, newValue: false });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
