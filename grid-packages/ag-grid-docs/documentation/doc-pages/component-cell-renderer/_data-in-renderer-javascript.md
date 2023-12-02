<framework-specific-section frameworks="javascript">
<snippet transform={false}>
|colDef.cellRenderer = params => {
|    // check the data exists, to avoid error
|    if (params.data) {
|        // data exists, so we can access it
|        return `**${params.data.theBoldValue}**`;
|    }
|    // when we return null, the grid will display a blank cell
|    return null;
|};
</snippet>
</framework-specific-section>