import {
  createGrid,
  FirstDataRenderedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ValueParserParams,
} from '@ag-grid-community/core';
import {AgAxisCaptionFormatterParams, AgCartesianSeriesTooltipRendererParams} from 'ag-charts-community';
import {getData} from "./data";

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'date', chartDataType: 'time', valueFormatter: (params) => params.value.toISOString().substring(0, 10) },
    { field: 'rain', chartDataType: 'series', valueParser: numberParser },
    { field: 'pressure', chartDataType: 'series', valueParser: numberParser },
    { field: 'temp', chartDataType: 'series', valueParser: numberParser },
  ],
  defaultColDef: { flex: 1 },
  enableRangeSelection: true,
  popupParent: document.body,
  enableCharts: true,
  chartThemeOverrides: {
    common: {
      padding: {
        top: 45,
      },
      axes: {
        number: {
          title: {
            enabled: true,
            formatter: (params: AgAxisCaptionFormatterParams)  => {
              return params.boundSeries.map(s => s.name).join(' / ');
            }
          }
        },
      },
    },
    bar: {
      series: {
        strokeWidth: 2,
        fillOpacity: 0.8,
        tooltip: {
          renderer: chartTooltipRenderer,
        },
      },
    },
    line: {
      series: {
        strokeWidth: 5,
        strokeOpacity: 0.8,
        tooltip: {
          renderer: chartTooltipRenderer,
        },
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
    chartContainer: document.querySelector('#myChart') as HTMLElement,
    cellRange: {
      columns: ['date', 'rain', 'pressure', 'temp'],
    },
    suppressChartRanges: true,
    seriesChartTypes: [
      { colId: 'rain', chartType: 'groupedColumn', secondaryAxis: false },
      { colId: 'pressure', chartType: 'line', secondaryAxis: true },
      { colId: 'temp', chartType: 'line', secondaryAxis: true },
    ],
    chartType: 'customCombo',
    aggFunc: 'sum',
  });
}

function numberParser(params: ValueParserParams) {
  const value = params.newValue;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return parseFloat(value);
}

function chartTooltipRenderer({ datum, xKey, yKey }: any) {
  return {
    content: `${formatDate(datum[xKey])}: ${datum[yKey]}`,
  };
}

function formatDate(date: Date | number) {
  return Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: undefined,
  }).format(new Date(date))
}

// set up the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
