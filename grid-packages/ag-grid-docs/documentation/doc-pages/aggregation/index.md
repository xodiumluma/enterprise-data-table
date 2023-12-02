---
title: "Aggregation"
enterprise: true
---

When [Row Grouping](/grouping/), aggregation functions can be applied to any column to populate the group row with values.

## Enabling Aggregation

There are two ways to enable aggregation. 

You can set `colDef.enableValue=true` to enable aggregation via the column menu and dragging in the columns tool panel. 

Another way to enable aggregations is with the built-in aggregation functions: `sum`, `min`, `max`, `count`, `avg`, `first`, and `last`. The following snippet shows how these agg functions can be applied to columns via `colDef.aggFunc`:

<snippet>
const gridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true }, 
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'max' },
        { field: 'bronze', aggFunc: 'avg' },
    ],
}
</snippet>

The example below uses the same built-in aggregation functions shown in the snippet above. Note the following:

- Rows are grouped by the **Country** and **Year** columns by enabling the `rowGroup` column definition property.

- The **Gold**, **Silver** and **Bronze** value columns have different agg functions applied via `colDef.aggFunc`.

<grid-example title='Enabling Aggregation' name='enabling-aggregation' type='generated' options='{ "enterprise": true, "exampleHeight": 540, "modules": ["clientside", "rowgrouping", "menu", "columnpanel", "filterpanel", "setfilter"] }'></grid-example>

<note>
| The built-in functions will support `bigint` values if you have them in your data, but the `avg`
| function will lose precision as it can only use integer arithmetic if `bigint` is used.
</note>

## Customisations

The previous example demonstrated how the built-in agg functions can be used, however extensive Aggregation customisations
are also possible as summarised below:

- **[Custom Functions](/aggregation-custom-functions/)** - provide custom aggregations to the grid.
- **[Aggregation Filtering](/aggregation-filtering/)** - configure and customise how aggregations are filtered.
- **[Other Customisations](/aggregation-other/)** - other ways to customise aggregations.

## API Reference

Aggregations can be configured using the following column property:

<api-documentation source='column-properties/properties.json' section='grouping' names='["aggFunc", "defaultAggFunc", "allowedAggFuncs"]'></api-documentation>

<br>

Aggregation functions can be registered with the grid using the following grid option:

<api-documentation source='grid-options/properties.json' section='rowPivoting' names='["aggFuncs", "suppressAggFilteredOnly", "groupAggFiltering","suppressAggFuncInHeader"]'></api-documentation>

## Next Up

Continue to the next section to learn about [Custom Functions](/aggregation-custom-functions/).
