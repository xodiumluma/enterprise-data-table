import { GridApi, createGrid, ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core';

const columnDefs: ColGroupDef[] = [
  {
    groupId: 'athleteGroupId',
    headerName: 'Athlete',
    children: [
      {
        headerName: 'Name',
        field: 'athlete',
        minWidth: 150,
        columnsMenuParams: {
          columnLayout: [{
            headerName: 'Group 1', // Athlete group renamed to "Group 1"
              children: [
                // custom column order with columns "gold", "silver", "bronze" omitted
                { field: 'sport' },
                { field: 'athlete' },
                { field: 'age' },
              ]
          }]
        },
      },
      {
        field: 'age',
        minWidth: 120,
      },
      {
        field: 'sport',
        minWidth: 150,
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
    menuTabs: ['columnsMenuTab']
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
