---
title: "Master / Detail"
enterprise: true
---

<video-section id="8OeJn75or2w" title="Master / Detail Video Tutorial" header="true">
    Master Detail refers to a top level grid called a Master Grid having rows that expand. When the row is expanded, another grid is displayed with more details related to the expanded row. The grid that appears is known as the Detail Grid.
</video-section>

## Enabling Master / Detail

Master / Detail can be enabled using the `masterDetail` grid option with detail rows configured using
`detailCellRendererParams` as shown below:

<snippet spaceBetweenProperties="true">
| const gridOptions = {
|     // enable Master / Detail
|     masterDetail: true,
| 
|     // the first Column is configured to use agGroupCellRenderer
|     columnDefs: [
|         { field: 'name', cellRenderer: 'agGroupCellRenderer' },
|         { field: 'account' }
|     ],
| 
|     // provide Detail Cell Renderer Params
|     detailCellRendererParams: {
|         // provide the Grid Options to use on the Detail Grid
|         detailGridOptions: {
|             columnDefs: [
|                 { field: 'callId' },
|                 { field: 'direction' },
|                 { field: 'number'}
|             ]
|         },
|         // get the rows for each Detail Grid
|         getDetailRowData: params => {
|             params.successCallback(params.data.callRecords);
|         }
|     }
| }
</snippet>

The example below shows a simple Master / Detail with all the above configured.

1. The grid property `masterDetail=true` is set. This tells the grid to allow expanding rows to display Detail Grids.

1. The Cell Renderer on the first column in the Master Grid is set to `agGroupCellRenderer`. This tells the grid to use the Group Cell Renderer which in turn includes the expand / collapse functionality for that column.

1. The Detail Cell Renderer parameter `detailGridOptions` is set. This contains configuration for the Detail Grid, such as which columns to display and which grid features to enable inside the Detail Grid.

1. A callback is provided via the Detail Cell Renderer parameter `getDetailRowData`. This callback is called for each Detail Grid and sets the rows to display in each Detail Grid.

<note>
To learn more about `detailCellRendererParams` configuration see the
[Detail Grids](../master-detail-grids/) section.
</note>

<grid-example title='Master Detail Example' name='simple' type='generated' options='{ "enterprise": true, "exampleHeight": 535, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>


## Row Models

When using Master / Detail the Master Grid must be using either the [Client-Side](/client-side-model/) or [Server-Side](/server-side-model-master-detail/) Row Models. It is not supported with the [Viewport](/viewport/) or [Infinite](/infinite-scrolling/) Row Models.

The Detail Grid on the other hand can use any Row Model.

## API Reference

### Master Detail Properties

Top level Master Detail properties available on the Grid Options:

<api-documentation source='grid-options/properties.json' section="masterDetail"></api-documentation>

### Detail Cell Renderer Params

Detail Cell Renderer parameters available on the `detailCellRendererParams` object:

<interface-documentation interfaceName='IDetailCellRendererParams' names='["detailGridOptions", "getDetailRowData", "template", "refreshStrategy"]' ></interface-documentation>
