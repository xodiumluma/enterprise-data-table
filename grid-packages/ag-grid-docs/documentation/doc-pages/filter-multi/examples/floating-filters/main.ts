import {
  GridApi,
  createGrid,
  GridOptions,
  IDateFilterParams,
  IMultiFilterParams,
  ISetFilterParams,
} from '@ag-grid-community/core';

var dateFilterParams: IMultiFilterParams = {
  filters: [
    {
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterDate: Date, cellValue: string) => {
          if (cellValue == null) return -1

          return getDate(cellValue).getTime() - filterDate.getTime()
        },
      } as IDateFilterParams,
    },
    {
      filter: 'agSetColumnFilter',
      filterParams: {
        comparator: (a: string, b: string) => {
          return getDate(a).getTime() - getDate(b).getTime()
        },
      } as ISetFilterParams,
    },
  ],
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'athlete', filter: 'agMultiColumnFilter' },
    {
      field: 'gold',
      filter: 'agMultiColumnFilter',
      filterParams: {
        filters: [
          {
            filter: 'agNumberColumnFilter',
          },
          {
            filter: 'agSetColumnFilter',
          },
        ],
      } as IMultiFilterParams,
    },
    {
      field: 'date',
      filter: 'agMultiColumnFilter',
      filterParams: dateFilterParams,
    },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 200,
    floatingFilter: true,
    menuTabs: ['filterMenuTab'],
  },
}

function getDate(value: string) {
  var dateParts = value.split('/')
  return new Date(
    Number(dateParts[2]),
    Number(dateParts[1]) - 1,
    Number(dateParts[0])
  )
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
