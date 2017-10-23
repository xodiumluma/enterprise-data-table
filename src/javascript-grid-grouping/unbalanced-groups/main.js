
var rowData = [

    {country: 'Ireland', state: null, city: 'Dublin'},
    {country: 'Ireland', state: null, city: 'Galway'},
    {country: 'Ireland', state: null, city: 'Cork'},

    {country: 'United Kingdom', state: null, city: 'London'},
    {country: 'United Kingdom', state: null, city: 'Manchester'},
    {country: 'United Kingdom', state: null, city: 'Liverpool'},

    {country: 'USA', state: 'New York', city: 'New York'},
    {country: 'USA', state: 'New York', city: 'Albany'},
    {country: 'USA', state: 'New York', city: 'Monroe'},
    {country: 'USA', state: 'New York', city: 'Onondaga'},
    {country: 'USA', state: 'New York', city: 'Westchester'},

    {country: 'USA', state: 'California', city: 'San Diego'},
    {country: 'USA', state: 'California', city: 'Los Angeles'},
    {country: 'USA', state: 'California', city: 'San Francisco'}
];

rowData.forEach( function(item, i) {
    item.val1 = ((i + 13) * 17 * 33) % 1000;
    item.val2 = ((i + 23) * 17 * 33) % 1000;
} );

var columnDefs = [
    {field: "city", cellRenderer: cityCellRenderer},
    {field: "country", cellRenderer: countryCellRenderer},
    {field: "state", cellRenderer: stateCellRenderer},
    {field: "val1", type: 'numberValue'},
    {field: "val2", type: 'numberValue'}
];

var gridOptions = {
    rowData: rowData,
    columnDefs: columnDefs,
    animateRows: true,
    groupDefaultExpanded: -1,
    autoGroupColumnDef: {
        field: 'city'
    },
    columnTypes: {
        'numberValue': {
            enableValue: true, aggFunc: 'sum', editable: true, valueParser: numberParser
        }
    }
};

var COUNTRY_CODES = {
    Ireland: "ie",
    "United Kingdom": "gb",
    "USA": "us"
};

function groupByState() {
    gridOptions.columnApi.setRowGroupColumns(['state']);
    gridOptions.columnApi.setColumnVisible('state', false);
    gridOptions.columnApi.setColumnVisible('city', false);
}

function resetGroup() {
    gridOptions.columnApi.setRowGroupColumns([]);
    gridOptions.columnApi.setColumnVisible('state', true);
    gridOptions.columnApi.setColumnVisible('city', true);
}

function numberParser(params) {
    return parseInt(params.newValue);
}

function countryCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://flags.fmcdn.net/data/flags/mini/' + COUNTRY_CODES[params.value] + '.png">';
        return flag + ' ' + params.value;
    }
}

function stateCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://www.ag-grid.com/images/goldStar.png">';
        return flag + ' ' + params.value;
    }
}

function cityCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://www.ag-grid.com/images/sun.png">';
        return flag + ' ' + params.value;
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});