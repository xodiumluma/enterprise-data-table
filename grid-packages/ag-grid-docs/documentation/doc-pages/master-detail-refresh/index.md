---
title: "Master / Detail - Detail Refresh"
enterprise: true
---

It is desirable for the Detail Grid to refresh when fresh data is available for it. The grid will attempt to refresh the data in the Detail Grid when the parent Master Grid row is updated.

The update actions that cause the Detail Rows to refresh are as follows:

- A change to [Row Data](/data-update-row-data/) updates the parent row and [Row IDs](/row-ids/) are provided*.
- A [Transaction Update](/data-update-transactions/) updates the parent row.
- The method `rowNode.setRowData(data)` is called on the parent row's [Row Node](/row-object/).

<note>
*If Row ID's are not provided, the grid will not match rows and treat the new Row Data as a new set. In this case, all rows are destroyed and re-created.
</note>

How the refresh occurs depends on the Refresh Strategy set on the Detail Cell Renderer. There are three Refresh Strategies which are as follows:


1. **Refresh Rows** - The detail panel calls `getDetailRowData(params)` again and sets the row data in the Detail Grid by using its `setRowData` grid API. This will keep the Detail Grid instance thus any changes in the Detail Grid (scrolling, column positions, etc.) will be kept. If the Detail Grid has [getRowId()](/row-ids/) implemented, then more grid context will be kept such as row selection, etc.

<framework-specific-section frameworks="javascript,angular,vue">

2. **Refresh Everything** - The Detail Panel will get destroyed and a fresh Detail Panel will be redrawn. This will result in `getDetailRowData(params)` getting called again. The Detail Grid will be a new instance and any changes in the Detail Grid (scrolling, column position, row selection, etc.) will be lost. If the Detail Panel is using a custom template, then the template will be re-created. Use this option if you want to update the template or you want a fresh detail grid instance.

</framework-specific-section>

<framework-specific-section frameworks="react">

2. **Refresh Everything** - The Detail Panel will get destroyed and a fresh Detail Panel will be redrawn. This will result in `getDetailRowData(params)` getting called again. The Detail Grid will be a new instance and any changes in the Detail Grid (scrolling, column position, row selection, etc.) will be lost. Use this option if you want a fresh detail grid instance.

</framework-specific-section>

3. **Do Nothing** - The Detail Panel will do nothing. The method `getDetailRowData(params)` will not be called. If any refresh is required within the detail grid, this will need to be handled independently by the application. Use this if your refresh requirements are not catered for by the other two options.

The strategy is set via the `refreshStrategy` parameter of the Detail Cell Renderer params. Valid values are `rows` for Refresh Rows, `everything` for Refresh Everything and `nothing` for Refresh Nothing. The default strategy is Refresh Rows.

Below are different examples to demonstrate each of the refresh strategies. Each example is identical with the exception of the refresh strategy used. Note the following about each example:

<framework-specific-section frameworks="javascript,angular,vue">

- Each Detail Grid has a title with the record's name and call count eg 'Nora Thomas 24 calls'. This is set by providing a custom Detail Cell Renderer template/ Only the detail strategy Refresh Everything will get this updated.
</framework-specific-section>

- The grid refreshes the first master row every two seconds as follows:
    - The call count is incremented.
    - Half of the call records (displayed in the detail grid) have their durations updated.

    All refresh strategies will have the Master Grid updated (as the strategy applies to the Detail Grid only), however each strategy will have the Detail Grid updated differently.

## Refresh Rows

This example shows the Refresh Rows strategy. Note the following:

- The Detail Cell Renderer params has `refreshStrategy='rows'`.

- The Detail Grid is **not** recreated. The callback `getDetailRowData(params)` is called. The row data in the Detail Grid is updated to reflect the new values. The grid's context (column position, vertical scroll) is kept. Try interacting with the Detail Grid for the first row (move columns, vertical scroll) and observe the grid is kept intact.

- Because the Detail Grid is configured with [getRowId()](/row-ids/) the data rows are updated rather than replaced. This allows context such maintaining Row Selection and flashing cells on data changes.

<framework-specific-section frameworks="javascript,angular,vue">

- The Detail Grid title 'Nora Thomas 24 calls' doesn't change as the template is only set once for the detail panel.
</framework-specific-section>

<grid-example title='Refresh Rows' name='refresh-rows' type='mixed' options='{ "enterprise": true, "exampleHeight": 550, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

## Refresh Everything

This example shows the Refresh Everything strategy. Note the following:


- The Detail Cell Renderer params has `refreshStrategy='everything'`.
- The callback `getDetailRowData(params)` is called. The Detail Grid is recreated and contains the most recent data. The grid's context (column position, vertical scroll) is lost.
- The Detail Grid providing [getRowId()](/row-ids/) is irrelevant as the Detail Grid is recreated.

<framework-specific-section frameworks="javascript,angular,vue">

- The detail grid title 'Nora Thomas 24 calls' updates with the new call count, as the refresh results in the template getting reset.
</framework-specific-section>

<grid-example title='Refresh Everything' name='refresh-everything' type='mixed' options='{ "enterprise": true, "exampleHeight": 550, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

## Refresh Nothing

This example shows the Refresh Nothing strategy. Note the following:

- The Detail Cell Renderer params has `refreshStrategy='nothing'`.
- No refresh is attempted.
- The callback `getDetailRowData(params)` is **not** called.
- The Detail Grid shows old data.
<framework-specific-section frameworks="javascript,angular,vue">

- The Detail Grid's title remains unchanged.
</framework-specific-section>

<grid-example title='Refresh Nothing' name='refresh-nothing' type='mixed' options='{ "enterprise": true, "exampleHeight": 550, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

