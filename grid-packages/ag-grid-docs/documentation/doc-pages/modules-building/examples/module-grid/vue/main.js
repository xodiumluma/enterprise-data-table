import Vue from 'vue';
import { AgGridVue } from '@ag-grid-community/vue';

import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';

ModuleRegistry.registerModules([ClientSideRowModelModule, MenuModule, ExcelExportModule]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

const VueExample = {
    template: `
        <ag-grid-vue style="width: 100%; height: 100%;"
                     class="ag-theme-quartz"
                     :columnDefs="columnDefs"
                     :rowData="rowData">
        </ag-grid-vue>
    `,
    components: {
        'ag-grid-vue': AgGridVue
    },
    data: function () {
        return {
            columnDefs: null,
            rowData: null
        };
    },
    beforeMount() {
        this.columnDefs = [
            { headerName: 'Make', field: 'make' },
            { headerName: 'Model', field: 'model' },
            { headerName: 'Price', field: 'price' }
        ];

        this.rowData = [
            { make: 'Toyota', model: 'Celica', price: 35000 },
            { make: 'Ford', model: 'Mondeo', price: 32000 },
            { make: 'Porsche', model: 'Boxster', price: 72000 }
        ];
    },
};

new Vue({
    el: '#app',
    components: {
        'my-component': VueExample
    }
});
