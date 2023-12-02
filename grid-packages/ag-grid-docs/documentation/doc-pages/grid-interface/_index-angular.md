<framework-specific-section frameworks="angular">
| The grid is configure via Inputs on the `ag-grid-angular` component. Properties consist of simple types, arrays, complex objects and callback functions.
</framework-specific-section>

<framework-specific-section frameworks="angular">
<snippet transform={false}>
| &lt;ag-grid-angular
|    // Set boolean properties
|    pagination    
|    // Bind property / callback to component
|    [columnDefs]="columnDefs"
|    [getRowHeight]="myGetRowHeight"
|
| &lt;/ag-grid-angular>
</snippet>
</framework-specific-section>