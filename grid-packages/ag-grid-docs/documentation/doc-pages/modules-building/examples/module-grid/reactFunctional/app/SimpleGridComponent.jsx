import React, { useState } from 'react';
import { AgGridReact } from '@ag-grid-community/react';

import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';

ModuleRegistry.registerModules([ClientSideRowModelModule, MenuModule, ExcelExportModule]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

const App = () => {
    const [columnDefs, setColumnDefs] = useState([
        { headerName: 'Make', field: 'make' },
        { headerName: 'Model', field: 'model' },
        { headerName: 'Price', field: 'price' },
    ]);

    const [rowData, setRowData] = useState([
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 }
    ]);

    return <div className='ag-theme-quartz'
        style={{
            width: '100%',
            height: '100%'
        }}>
        <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
        />

    </div>;
};

export default App;
