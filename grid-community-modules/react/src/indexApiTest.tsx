import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from './agGridReact';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

interface RowData {
    make: string;
    model: string;
    price: number;
}

const App = () => {
    const gridRef = useRef<AgGridReact<RowData>>(null);

    const [rowData] = useState([
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 }
    ]);
    const [colDefs, setColDefs] = useState<ColDef<RowData>[]>([
        { field: 'make' },
        { field: 'model' },
        { field: 'price' },
    ]);

    useEffect(() => {
        console.log(gridRef.current?.api.setGridOption('rowData', [ { make: 'Toyota', model: 'Celica', price: 35000 } ]));
    }, [])

    return (
        <div className="ag-theme-quartz" style={{height: 400, width: 600}}>
            <AgGridReact
                ref={ gridRef }
                rowData={ rowData }
                columnDefs={colDefs}
                modules={[ClientSideRowModelModule]} />
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
