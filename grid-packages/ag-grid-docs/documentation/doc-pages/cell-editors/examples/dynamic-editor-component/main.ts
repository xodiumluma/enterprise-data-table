import {
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  GridApi,
  createGrid,
  GridOptions,
  ICellEditorParams,
  RowEditingStartedEvent,
  RowEditingStoppedEvent,
  CellEditorSelectorResult,
} from '@ag-grid-community/core';
import { getData, IRow } from "./data";
import { MoodEditor } from './moodEditor_typescript';
import { NumericCellEditor } from './numericCellEditor_typescript';


let gridApi: GridApi<IRow>;


const gridOptions: GridOptions<IRow> = {
  columnDefs: [
    { field: 'type' },
    {
      field: 'value',
      editable: true,
      cellEditorSelector: cellEditorSelector
    }
  ],
  defaultColDef: {
    flex: 1,
    cellDataType: false,
  },
  rowData: getData(),

  onRowEditingStarted: onRowEditingStarted,
  onRowEditingStopped: onRowEditingStopped,
  onCellEditingStarted: onCellEditingStarted,
  onCellEditingStopped: onCellEditingStopped,
}

function onRowEditingStarted(event: RowEditingStartedEvent) {
  console.log('never called - not doing row editing')
}

function onRowEditingStopped(event: RowEditingStoppedEvent) {
  console.log('never called - not doing row editing')
}

function onCellEditingStarted(event: CellEditingStartedEvent) {
  console.log('cellEditingStarted')
}

function onCellEditingStopped(event: CellEditingStoppedEvent) {
  console.log('cellEditingStopped')
}

function cellEditorSelector(params: ICellEditorParams<IRow>): CellEditorSelectorResult | undefined {
  if (params.data.type === 'age') {
    return {
      component: NumericCellEditor,
    }
  }

  if (params.data.type === 'gender') {
    return {
      component
        : 'agRichSelectCellEditor',
      params: {
        values: ['Male', 'Female']
      },
      popup: true
    }
  }

  if (params.data.type === 'mood') {
    return {
      component: MoodEditor,
      popup: true,
      popupPosition: 'under'
    }
  }

  return undefined
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
