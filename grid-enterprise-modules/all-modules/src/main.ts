import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";
import { AdvancedFilterModule } from "@ag-grid-enterprise/advanced-filter";
import { ClipboardModule } from "@ag-grid-enterprise/clipboard";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { ExcelExportModule } from "@ag-grid-enterprise/excel-export";
import { FiltersToolPanelModule } from "@ag-grid-enterprise/filter-tool-panel";
import { GridChartsModule } from "@ag-grid-enterprise/charts";
import { MasterDetailModule } from "@ag-grid-enterprise/master-detail";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { MultiFilterModule } from "@ag-grid-enterprise/multi-filter";
import { RangeSelectionModule } from "@ag-grid-enterprise/range-selection";
import { RichSelectModule } from "@ag-grid-enterprise/rich-select";
import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";
import { ServerSideRowModelModule } from "@ag-grid-enterprise/server-side-row-model";
import { SetFilterModule } from "@ag-grid-enterprise/set-filter";
import { SideBarModule } from "@ag-grid-enterprise/side-bar";
import { StatusBarModule } from "@ag-grid-enterprise/status-bar";
import { ViewportRowModelModule } from "@ag-grid-enterprise/viewport-row-model";
import { SparklinesModule } from "@ag-grid-enterprise/sparklines";

export * from "@ag-grid-community/all-modules";
export * from "@ag-grid-enterprise/advanced-filter";
export * from "@ag-grid-enterprise/clipboard";
export * from "@ag-grid-enterprise/column-tool-panel";
export * from "@ag-grid-enterprise/excel-export";
export * from "@ag-grid-enterprise/filter-tool-panel";
export * from "@ag-grid-enterprise/charts";
export * from "@ag-grid-enterprise/master-detail";
export * from "@ag-grid-enterprise/menu";
export * from "@ag-grid-enterprise/multi-filter";
export * from "@ag-grid-enterprise/range-selection";
export * from "@ag-grid-enterprise/rich-select";
export * from "@ag-grid-enterprise/row-grouping";
export * from "@ag-grid-enterprise/server-side-row-model";
export * from "@ag-grid-enterprise/set-filter";
export * from "@ag-grid-enterprise/side-bar";
export * from "@ag-grid-enterprise/status-bar";
export * from "@ag-grid-enterprise/viewport-row-model";
export * from "@ag-grid-enterprise/core";
export * from "@ag-grid-enterprise/sparklines";

export const AllEnterpriseModules: Module[] = [
    AdvancedFilterModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    GridChartsModule,
    MasterDetailModule,
    MenuModule,
    MultiFilterModule,
    RangeSelectionModule,
    RichSelectModule,
    RowGroupingModule,
    ServerSideRowModelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
    ViewportRowModelModule,
    SparklinesModule
];

export const AllModules: Module[] = AllCommunityModules.concat(AllEnterpriseModules);
