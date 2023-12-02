import Vue from 'vue';
import { AgGridVue } from '@ag-grid-community/vue';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import MedalCellRenderer from './medalCellRendererVue.js';
import TotalValueRenderer from './totalValueRendererVue.js';

import { ModuleRegistry } from '@ag-grid-community/core';
// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <ag-grid-vue
                    style="width: 100%; height: 100%;"
                    :class="themeClass"
                    id="myGrid"
                    :columnDefs="columnDefs"
                    @grid-ready="onGridReady"
                    :defaultColDef="defaultColDef"
                    :rowData="rowData"></ag-grid-vue>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        medalCellRenderer: MedalCellRenderer,
        totalValueRenderer: TotalValueRenderer
    },
    data: function () {
        return {
            columnDefs: [
                { field: "athlete" },
                { field: "year", minWidth: 60 },
                {
                    field: "gold",
                    cellRenderer: "medalCellRenderer",
                },
                {
                    field: "silver",
                    cellRenderer: "medalCellRenderer",
                },
                {
                    field: "bronze",
                    cellRenderer: "medalCellRenderer",
                },
                {
                    field: "total",
                    minWidth: 190,
                    cellRenderer: "totalValueRenderer",
                },
            ],
            gridApi: null,
            defaultColDef: {
                editable: true,
                flex: 1,
                minWidth: 100,
                filter: true,
            },
            rowData: null,
            themeClass: /** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/,
        }
    },
    beforeMount() {

    },
    methods: {
        onGridReady(params) {
            this.gridApi = params.api;


            const updateData = (data) => {
                this.rowData = data;
            };

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then(resp => resp.json())
                .then(data => updateData(data));
        },
    }
}


new Vue({
    el: '#app',
    components: {
        'my-component': VueExample
    }
});
