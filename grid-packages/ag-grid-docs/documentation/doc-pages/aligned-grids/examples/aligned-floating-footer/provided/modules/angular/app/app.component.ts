import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core';

import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule])

@Component({
    selector: 'my-app',
    styles: [`.bold-row {
        font-weight: bold;
    } `],
    template: `
        <div style="height: 100%; display: flex; flex-direction: column" class="example-container">
            <ag-grid-angular
                    style="flex: 1 1 auto;"
                    #topGrid
                    [class]="themeClass"
                    [rowData]="rowData"
                    [gridOptions]="topOptions"
                    [alignedGrids]="[bottomGrid]"
                    [columnDefs]="columnDefs">
            </ag-grid-angular>

            <ag-grid-angular
                    style="flex: none; height: 60px;"
                    #bottomGrid
                    [class]="themeClass"
                    [rowData]="bottomData"
                    [gridOptions]="bottomOptions"
                    [alignedGrids]="[topGrid]"
                    [columnDefs]="columnDefs">
            </ag-grid-angular>
        </div>
    `
})
export class AppComponent {
    themeClass = /** DARK MODE START **/document.documentElement?.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/;
    columnDefs!: (ColDef | ColGroupDef)[];
    rowData!: any[];
    topOptions: GridOptions = {
        defaultColDef: {

            filter: true,
            flex: 1,
            minWidth: 100
        }
        ,
        suppressHorizontalScroll: true,
        alwaysShowVerticalScroll: true,
        autoSizeStrategy: {
            type: 'fitCellContents'
        },
    };
    bottomOptions: GridOptions = {
        headerHeight: 0,
        rowStyle: { fontWeight: 'bold' },
        defaultColDef: {

            filter: true,
            flex: 1,
            minWidth: 100
        },
        alwaysShowVerticalScroll: true,
    };

    bottomData = [
        {
            athlete: 'Total',
            age: '15 - 61',
            country: 'Ireland',
            year: '2020',
            date: '26/11/1970',
            sport: 'Synchronised Riding',
            gold: 55,
            silver: 65,
            bronze: 12
        }
    ];

    constructor(private http: HttpClient) {
        this.columnDefs = [
            { field: 'athlete', width: 200 },
            { field: 'age', width: 100 },
            { field: 'country', width: 150 },
            { field: 'year', width: 120 },
            { field: 'sport', width: 200 },
            {
                headerName: 'Total',
                colId: 'total',
                valueGetter: 'data.gold + data.silver + data.bronze',
                width: 200
            },
            { field: 'gold', width: 100 },
            { field: 'silver', width: 100 },
            { field: 'bronze', width: 100 }
        ];

    }

    ngOnInit() {
        this.http.get('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .subscribe(data => {
                this.rowData = data as any[];
            });
    }
}
