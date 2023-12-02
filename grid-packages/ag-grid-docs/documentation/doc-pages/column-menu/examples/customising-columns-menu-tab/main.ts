import { GridApi, createGrid, ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core';

const columnDefs: ColGroupDef[] = [
  {
    groupId: 'athleteGroupId',
    headerName: 'Athlete',
    children: [
      {
        headerName: 'Name',
        field: 'athlete',
        minWidth: 200,
        columnsMenuParams: {
          // hides the Column Filter section
          suppressColumnFilter: true,

          // hides the Select / Un-select all widget
          suppressColumnSelectAll: true,

          // hides the Expand / Collapse all widget
          suppressColumnExpandAll: true,
        },
      },
      {
        field: 'age',
        minWidth: 200,
        columnsMenuParams: {
          // contracts all column groups
          contractColumnSelection: true,
        },
      },
    ],
  },
  {
    groupId: 'medalsGroupId',
    headerName: 'Medals',
    children: [{ field: 'gold' }, { field: 'silver' }, { field: 'bronze' }],
  },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: columnDefs,
  defaultColDef: {
    flex: 1,
    menuTabs: ['columnsMenuTab'],
    columnsMenuParams: {
      // suppresses updating the layout of columns as they are rearranged in the grid
      suppressSyncLayoutWithGrid: true,
    },
  },
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
