import {
  GridApi,
  createGrid,
  ColDef,
  GridOptions,
  IRichCellEditorParams,
} from '@ag-grid-community/core';
import { ColourCellRenderer } from './colourCellRenderer_typescript'
import { colors } from './colors';

const columnDefs: ColDef[] = [
  { 
    headerName: 'Rich Select Editor', 
    field: 'color', 
    cellRenderer: ColourCellRenderer,
    cellEditor: 'agRichSelectCellEditor',
    cellEditorParams: {
      values: colors, 
      cellRenderer: ColourCellRenderer,
      valueListMaxHeight: 220
    } as IRichCellEditorParams
  },
];

function getRandomNumber(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const data = Array.from(Array(20).keys()).map(() => {
  const color = colors[getRandomNumber(0, colors.length - 1)];
  return ({ color });
});

let gridApi: GridApi;

const gridOptions: GridOptions = {
  defaultColDef: {
    width: 200,
    editable: true
  },
  columnDefs: columnDefs,
  rowData: data
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
