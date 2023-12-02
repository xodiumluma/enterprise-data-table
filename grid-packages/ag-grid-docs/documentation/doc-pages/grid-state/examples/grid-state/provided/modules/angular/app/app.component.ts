
import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273
import '@ag-grid-community/styles/ag-grid.css';
import "@ag-grid-community/styles/ag-theme-quartz.css";
import '../styles.css';
import { ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent, SideBarDef, createGrid, GridState, GridPreDestroyedEvent, StateUpdatedEvent } from '@ag-grid-community/core';
// Required feature modules are registered in app.module.ts
import { IOlympicData } from './interfaces'

@Component({
    selector: 'my-app',
    template: `
        <div class="example-wrapper">
            <div>
                <span class="button-group">
                    <button (click)="reloadGrid()">Recreate Grid with Current State</button>
                    <button (click)="printState()">Print State</button>
                </span>
            </div>
            <ag-grid-angular *ngIf="gridVisible"
                style="width: 100%; height: 100%;"
                [class]="themeClass"
                [columnDefs]="columnDefs"
                [defaultColDef]="defaultColDef"
                [enableRangeSelection]="true"
                [sideBar]="true"
                [pagination]="true"
                [rowSelection]="rowSelection"
                [suppressRowClickSelection]="true"
                [suppressColumnMoveAnimation]="true"
                [rowData]="rowData"
                [initialState]="initialState"
                [gridOptions]="gridOptions"
                (stateUpdated)="onStateUpdated($event)"
                (gridReady)="onGridReady($event)"
            ></ag-grid-angular>
        </div>
    `
})

export class AppComponent {
    themeClass = /** DARK MODE START **/document.documentElement?.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/;
    private gridApi!: GridApi<IOlympicData>;
    
    public columnDefs: ColDef[] = [
        {
            field: 'athlete',
            minWidth: 150,
            headerCheckboxSelection: true,
            checkboxSelection: true,
        },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    public defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    };
    public rowSelection: 'single' | 'multiple' = 'multiple';
    public rowData?: IOlympicData[];
    public gridVisible = true;
    public initialState?: GridState;
    public gridOptions: GridOptions = {
        onGridPreDestroyed: (params: GridPreDestroyedEvent<IOlympicData>) => {
            console.log('Grid state on destroy (can be persisted)', params.state)
        }
    };

    constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

    reloadGrid(): void {
        const state = this.gridApi.getState();
        this.gridVisible = false;
        this.cdRef.detectChanges();
        this.initialState = state;
        this.rowData = undefined;
        setTimeout(() => {
            this.gridVisible = true;
            this.cdRef.detectChanges();
        });
    }

    printState(): void {
        console.log('Grid state', this.gridApi.getState());
    }

    onStateUpdated(params: StateUpdatedEvent<IOlympicData>): void {
        console.log('State updated', params.state);
    }

    onGridReady(params: GridReadyEvent<IOlympicData>): void {
        this.gridApi = params.api;
        this.http.get<IOlympicData[]>('https://www.ag-grid.com/example-assets/olympic-winners.json').subscribe(data => this.rowData = data);
    }
}




