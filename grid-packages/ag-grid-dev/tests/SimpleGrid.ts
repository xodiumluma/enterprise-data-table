import {createGrid, GridOptions} from "ag-grid-community";

import "ag-grid-enterprise";

export class SimpleGrid {
    private readonly gridOptions: GridOptions = {};

    constructor(selector: string, gridModule: any) {
        this.gridOptions = {
            columnDefs: this.createColumnDefs(),
            rowData: this.createRowData(),
            enableCharts: true,
            enableRangeSelection: true
        };

        let eGridDiv: HTMLElement = <HTMLElement>document.querySelector(selector);
        createGrid(eGridDiv, this.gridOptions, { modules: [gridModule]});
    }

    // specify the columns
    private createColumnDefs() {
        return [
            {headerName: "Make", field: "make"},
            {headerName: "Model", field: "model"},
            {headerName: "Price", field: "price", enableValue: true}
        ];
    }

    // specify the data
    private createRowData() {
        return [
            {make: "Toyota", model: "Celica", price: 35000},
            {make: "Ford", model: "Mondeo", price: 32000},
            {make: "Porsche", model: "Boxster", price: 72000}
        ];
    }
}
