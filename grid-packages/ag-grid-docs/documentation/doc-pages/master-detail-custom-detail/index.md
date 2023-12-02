---
title: "Custom Detail"
enterprise: true
---

When a Master Row is expanded, the grid uses the default Detail Cell Renderer to create and display the Detail Grid inside one row of the Master Grid. You can provide a custom Detail Cell Renderer to display something else if the default Detail Cell Renderer doesn't do what you want.

Configure the grid to use a custom Detail Cell Renderer using the grid property `detailCellRenderer`.

<snippet spaceBetweenProperties="true">
const gridOptions = {
    // normally left blank, the grid will use the default Detail Cell Renderer
    detailCellRenderer: 'myCellRendererComp',
    // params sent to the Detail Cell Renderer, in this case your MyCellRendererComp
    detailCellRendererParams: {},
}
</snippet>

The Detail Cell Renderer should be a [Cell Renderer](/component-cell-renderer/) component. See [Cell Renderer](/component-cell-renderer/) on how to build
and register a Cell Renderer with the grid.

The following examples demonstrate minimalist custom Detail Cell Renderer. Note that where a Detail Grid would normally appear, only the message "My Custom Detail" is shown.

<grid-example title='Simple Detail Cell Renderer' name='simple-custom-detail' type='generated' options='{ "enterprise": true, "exampleHeight": 545, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

## Custom Detail With Form

It is not mandatory to display a grid inside the detail section. As you are providing a custom component, there are no restrictions as to what can appear inside the custom component.

This example shows a custom Detail Cell Renderer that uses a form rather than a grid.

<grid-example title='Custom Detail Cell Renderer with Form' name='custom-detail-with-form' type='generated' options='{ "enterprise": true, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

## Custom Detail With Grid

It is possible to provide a Custom Detail Grid that does a similar job to the default Detail Cell Renderer. This example demonstrates displaying a custom grid as the detail.

<grid-example title='Custom Detail Cell Renderer with Grid' name='custom-detail-with-grid' type='mixed' options='{ "enterprise": true, "exampleHeight": 545, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>
 
## Register Detail Grid

In order for the Detail Grid's API to be available via the Master Grid as explained in [Accessing Detail Grids](/master-detail-grids/#accessing-detail-grids), a Grid Info object needs to be registered with the Master Grid.

<api-documentation source='grid-api/api.json' section='masterDetail' names='["addDetailGridInfo", "removeDetailGridInfo"]'></api-documentation>

When the Detail Grid is created, register it via `masterGridApi.addDetailGridInfo(id, info)` and when the Detail Grid is destroyed, unregister it via `masterGridApi.removeDetailGridInfo(id)`. A Detail ID is required when calling these methods. Any unique ID can be used, however for consistency with how the default Detail Cell Renderer works it's recommended to use the ID of the detail Row Node.

```js
//////////////////////////////
// Register with Master Grid
const detailId = params.node.id;

// Create Grid Info object
const detailGridInfo = {
    id: detailId,
    api: params.api,
};

this.masterGridApi.addDetailGridInfo(detailId, detailGridInfo);

//////////////////////////////
// Unregister with Master Grid
this.masterGridApi.removeDetailGridInfo(detailId);
```

## Refreshing

When data is updated in the grid using [Transaction Updates](/data-update-transactions/), the grid will call refresh on all Detail Cell Renderers.

It is up to the Detail Cell Renderer whether it wants to act on the refresh or not. If the `refresh()` method returns `true`, the grid will assume the Detail Cell Renderer has refreshed successfully and nothing more will happen. However if `false` is returned, the grid will destroy the Detail Cell Renderer and re-create it again.

This pattern is similar to how refresh works for normal grid Cell Renderers.

The example below shows how components can refresh on updates. The example refreshes the first row every one second. The `refresh()` method gets called on the corresponding Detail Cell Renderer after the transaction is applied. The Detail Cell Renderer refresh method reads the latest call count from the params, and the last updated time is also changed.

<grid-example title='Custom Detail with Refresh' name='custom-detail-with-refresh' type='generated' options='{ "enterprise": true, "exampleHeight": 545, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>

## Keyboard Navigation

To add keyboard navigation to custom detail panels, it must be implemented in the custom Detail Cell Renderer. There are several parts to this:

1. Create a listener function for the `focus` event when the custom detail panel receives focus. Within this function, the event object `target` value is the custom detail row element, and event object `relatedTarget` value is the previous element that was previously focused on. You will need to find the parent of the `relatedTarget` with `role=row` attribute to get the previous row element. With the current row element and the previous row element, checking the `row-index` attribute allows you to see if the user is entering the focus from the previous or current row (ie, `row-index` increases or is the same from previous to current) or the next row (ie, `row-index` decreases from previous to current). With this knowledge, you can set focus using `element.focus()` on the relevant element in your custom detail panel
2. Attach the above function to a `focus` listener on the `eParentOfValue` param value in the component initialisation
3. Remove the above function from the `focus` listener in the component destroy or unmount method

The following example shows an implementation of keyboard navigation in a custom detail panel: 

* Click a cell in the `Mila Smith` master row and press <kbd>⇥ Tab</kbd> key to move focus to the custom detail panel inputs of the `Mila Smith` master row.
* Click a cell in the `Evelyn Taylor` master row and press <kbd>⇧ Shift</kbd>+<kbd>⇥ Tab</kbd> to focus the inputs in the custom detail panel of the `Mila Smith` master row.

<note>
This example is illustrative of the main concepts, but the actual implementation of custom keyboard navigation will vary based on the specific custom detail panel.
</note>

<grid-example title='Custom Detail Cell Renderer Keyboard Navigation' name='custom-detail-keyboard-navigation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>
