import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular'; // Angular Grid Logic
import { CellValueChangedEvent, ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community'; // Column Definitions Interface
import { HttpClient } from '@angular/common/http';
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
ModuleRegistry.registerModules([ ClientSideRowModelModule ]);

// Row Data Interface
interface IRow {
  mission: string;
  company: string;
  location: string;
  date: string;
  time: string;
  rocket: string;
  price: number;
  successful: boolean;
}

// Custom Cell Renderer Component
@Component({
  selector: 'app-company-logo-renderer',
  standalone: true,
  imports: [CommonModule],
  template:
  `
  <span *ngIf="value" >
    <img
      [alt]="value"
      [src]="'https://downloads.jamesswinton.com/space-company-logos/' + value.toLowerCase() + '.png'"
    />
    <p>{{ value }}</p>
  </span>
  `,
  styles: ["img {display: block; width: 25px; height: auto; maxHeight: 50%; margin-right: 12px; filter: brightness(1.2);} span {display: flex; height: 100%; width: 100%; align-items: center} p { text-overflow: ellipsis; overflow: hidden; white-space: nowrap }"]
})

export class CompanyLogoRenderer implements ICellRendererAngularComp {
  // Init Cell Value
  public value!: string;
  agInit(params: ICellRendererParams): void {
    this.value = params.value;
  }

  // Return Cell Value
  refresh(params: ICellRendererParams): boolean {
    this.value = params.value;
    return true;
  }
}

@Component({
  selector: 'my-app',
  template: 
  `
  <div class="content">
    <!-- The AG Grid component, with Dimensions, CSS Theme, Row Data, and Column Definition -->
    <ag-grid-angular
      style="width: 100%; height: 550px;"
      [class]="themeClass"
      [rowData]="rowData"
      [columnDefs]="colDefs"
      [defaultColDef]="defaultColDefs" 
      [pagination]="true"
      (gridReady)="onGridReady($event)"
      (cellValueChanged)="onCellValueChanged($event)"
    >
    </ag-grid-angular>
  </div>
  `
})

export class AppComponent {
  themeClass = /** DARK MODE START **/document.documentElement?.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/;
  // Row Data: The data to be displayed.
  rowData: IRow[] = [];

  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef[] = [
    { 
      field: "mission", 
      filter: true 
    },
    { 
      field: "company",
      cellRenderer: CompanyLogoRenderer 
    },
    { 
      field: "location"
    },
    { field: "date" },
    { 
      field: "price",
      valueFormatter: (params: ValueFormatterParams) => { return '£' + params.value.toLocaleString(); } 
    },
    { field: "successful" },
    { field: "rocket" }
  ];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDefs: ColDef = {
    filter: true,
    editable: true
  }

  // Handle cell editing event
  onCellValueChanged = (event: CellValueChangedEvent) => {
    console.log(`New Cell Value: ${event.value}`)
  }

  // Load data into grid when ready
  constructor(private http: HttpClient) {}
  onGridReady(params: GridReadyEvent) {
    this.http
      .get<any[]>('https://downloads.jamesswinton.com/space-mission-data.json')
      .subscribe(data => this.rowData = data);
  }
}
