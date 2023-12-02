import { createApp } from 'vue';
import { AgGridVue } from '@ag-grid-community/vue3';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import '@ag-grid-community/styles/ag-grid.css';
import "@ag-grid-community/styles/ag-theme-quartz.css";
import MyInnerRenderer from './myInnerRendererVue.js';

import { ModuleRegistry } from '@ag-grid-community/core';
// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <ag-grid-vue

                    style="width: 100%; height: 100%;"
                    :class="themeClass"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :autoGroupColumnDef="autoGroupColumnDef"
                    :groupIncludeFooter="true"
                    :groupIncludeTotalFooter="true"
                    :rowData="rowData"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        MyInnerRenderer
    },
    data: function () {
        return {
            columnDefs: [{
                field: "country",
                rowGroup: true,
                hide: true
            }, {
                field: "year",
                rowGroup: true,
                hide: true
            }, {
                field: "gold",
                aggFunc: "sum"
            }, {
                field: "silver",
                aggFunc: "sum"
            }, {
                field: "bronze",
                aggFunc: "sum"
            }],
            gridApi: null,
            defaultColDef: {
                flex: 1,
                minWidth: 150,
            },
            autoGroupColumnDef: {
                minWidth: 300,
                cellRendererParams: {
                    innerRenderer: 'MyInnerRenderer'
                }
            },
            rowData: null,
            themeClass: /** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/,
        }
    },
    created() {
        this.rowData = getData()
    }
}

createApp(VueExample)
    .mount("#app")

