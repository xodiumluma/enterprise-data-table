import {
    GridApi,
    createGrid,
    GridOptions,
    ISetFilter,
    ISetFilterParams,
    KeyCreatorParams,
    ValueFormatterParams,
    FirstDataRenderedEvent,
} from '@ag-grid-community/core';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            filter: 'agSetColumnFilter',
        },
        {
            field: 'country',
            valueFormatter: (params: ValueFormatterParams) => {
                return `${params.value.name} (${params.value.code})`
            },
            keyCreator: countryKeyCreator,
            filterParams: { valueFormatter: (params: ValueFormatterParams) => params.value.name } as ISetFilterParams,
        },
        { field: 'age', maxWidth: 120, filter: 'agNumberColumnFilter' },
        { field: 'year', maxWidth: 120 },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold', filter: 'agNumberColumnFilter' },
        { field: 'silver', filter: 'agNumberColumnFilter' },
        { field: 'bronze', filter: 'agNumberColumnFilter' },
        { field: 'total', filter: 'agNumberColumnFilter' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 160,
        filter: true,
    },
    sideBar: 'filters',
    onFirstDataRendered: onFirstDataRendered,
}

function countryKeyCreator(params: KeyCreatorParams) {
    return params.value.name
}

function patchData(data: any[]) {
    // hack the data, replace each country with an object of country name and code
    data.forEach((row) => {
        const countryName = row.country
        const countryCode = countryName.substring(0, 2).toUpperCase()
        row.country = {
            name: countryName,
            code: countryCode,
        }
    })
}

function selectJohnAndKenny() {
    const instance = gridApi!.getFilterInstance('athlete')!
    instance.setModel({ values: ['John Joe Nevin', 'Kenny Egan'] })
    gridApi!.onFilterChanged()
}

function selectEverything() {
    const instance = gridApi!.getFilterInstance('athlete')!
    instance.setModel(null)
    gridApi!.onFilterChanged()
}

function selectNothing() {
    const instance = gridApi!.getFilterInstance('athlete')!
    instance.setModel({ values: [] })
    gridApi!.onFilterChanged()
}

function setCountriesToFranceAustralia() {
    const instance = gridApi!.getFilterInstance<ISetFilter<{ name: string, code: string }>>('country')!;
    instance.setFilterValues([
        {
            name: 'France',
            code: 'FR',
        },
        {
            name: 'Australia',
            code: 'AU'
        }
    ])
    instance.applyModel()
    gridApi!.onFilterChanged()
}

function setCountriesToAll() {
    const instance = gridApi!.getFilterInstance<ISetFilter<{ name: string, code: string }>>('country')!;
    instance.resetFilterValues()
    instance.applyModel()
    gridApi!.onFilterChanged()
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.getToolPanelInstance('filters')!.expandFilters()
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(function (data) {
            patchData(data)
            gridApi!.setGridOption('rowData', data)
        })
})
