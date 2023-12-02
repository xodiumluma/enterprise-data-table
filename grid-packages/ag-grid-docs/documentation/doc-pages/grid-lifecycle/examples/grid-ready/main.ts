import { GridApi, createGrid, GridOptions, GridReadyEvent } from '@ag-grid-community/core';
import { getData,TAthlete } from './data';

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'name', headerName: 'Athlete', width: 250 },
        { field: 'person.country', headerName: 'Country' },
        { field: 'person.age', headerName: 'Age' },
        { field: 'medals.gold', headerName: 'Gold Medals' },
        { field: 'medals.silver', headerName: 'Silver Medals' },
        { field: 'medals.bronze', headerName: 'Bronze Medals' },
    ],
    rowData: getData(),
    rowSelection: 'multiple',
    onGridReady: (params: GridReadyEvent<TAthlete>) => {
        const checkbox = document.querySelector<HTMLInputElement>('#pinFirstColumnOnLoad')!;
        const shouldPinFirstColumn = checkbox && checkbox.checked;
        if (shouldPinFirstColumn) {
            params.api.applyColumnState({
                state: [
                    { colId: 'name', pinned: 'left' },
                ],
            });
        }
    },
};

function reloadGrid() {
  if (gridApi) {
    gridApi.destroy()
  }

  setTimeout(() => {
    // Artificial delay to show grid being destroyed and re-created
    const gridDiv = document.querySelector<HTMLElement>("#myGrid")!
    gridApi = createGrid(gridDiv, gridOptions);
  }, 500)
}

const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
gridApi = createGrid(gridDiv, gridOptions);
