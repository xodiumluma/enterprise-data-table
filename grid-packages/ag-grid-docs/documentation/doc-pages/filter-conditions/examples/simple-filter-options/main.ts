import {
  GridApi,
  createGrid,
  ColDef,
  GridOptions,
  IDateFilterParams,
  ITextFilterParams,
  INumberFilterParams,
} from '@ag-grid-community/core';

var filterParams: IDateFilterParams = {
  maxNumConditions: 1,
  comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
    var dateAsString = cellValue
    if (dateAsString == null) return -1
    var dateParts = dateAsString.split('/')
    var cellDate = new Date(
      Number(dateParts[2]),
      Number(dateParts[1]) - 1,
      Number(dateParts[0])
    )

    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
      return 0
    }

    if (cellDate < filterLocalDateAtMidnight) {
      return -1
    }

    if (cellDate > filterLocalDateAtMidnight) {
      return 1
    }
    return 0;
  },
}

const columnDefs: ColDef[] = [
  { field: 'athlete' },
  {
    field: 'country',
    filterParams: {
      filterOptions: ['contains', 'startsWith', 'endsWith'],
      defaultOption: 'startsWith',
    } as ITextFilterParams,
  },
  {
    field: 'sport',
    filterParams: {
      maxNumConditions: 10,
    } as ITextFilterParams,
  },
  {
    field: 'age',
    filter: 'agNumberColumnFilter',
    filterParams: {
      numAlwaysVisibleConditions: 2,
      defaultJoinOperator: 'OR',
    } as INumberFilterParams,
    maxWidth: 100,
  },
  {
    field: 'date',
    filter: 'agDateColumnFilter',
    filterParams: filterParams,
  },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: columnDefs,
  defaultColDef: {
    flex: 1,
    minWidth: 150,
    filter: true,
  },
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data))
})
