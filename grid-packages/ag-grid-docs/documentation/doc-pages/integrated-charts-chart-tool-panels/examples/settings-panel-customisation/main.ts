import {createGrid, FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent} from '@ag-grid-community/core';
import {getData} from './data';

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {field: 'country', chartDataType: 'category', width: 150},
        {field: 'gold', chartDataType: 'series'},
        {field: 'silver', chartDataType: 'series'},
        {field: 'bronze', chartDataType: 'series'},
    ],
    defaultColDef: {flex: 1},
    enableRangeSelection: true,
    popupParent: document.body,
    enableCharts: true,
    chartToolPanelsDef: {
        defaultToolPanel: 'settings',
        settingsPanel: {
            chartGroupsDef: {
                pieGroup: ['doughnut', 'pie'],
                columnGroup: ['stackedColumn', 'column', 'normalizedColumn'],
                barGroup: ['bar'],
            },
        },
    },
    onGridReady : (params: GridReadyEvent) => {
    getData().then(rowData => params.api.setGridOption('rowData', rowData));
  },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 4,
            columns: ['country', 'gold', 'silver', 'bronze'],
        },
        chartType: 'groupedColumn',
    });
}

document.addEventListener('DOMContentLoaded', () => {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
