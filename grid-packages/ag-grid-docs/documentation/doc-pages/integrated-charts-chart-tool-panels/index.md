---
title: "Chart Tool Panels"
enterprise: true
---

The Chart Tool Panels allow users to change the selected chart type and customise the data and chart formatting. 

<div style="display: flex; margin-bottom: 25px; margin-top: 25px; margin-left: 35px">
    <figure style="flex: 3; margin: 0;">
        <image-caption src="integrated-charts-chart-tool-panels/resources/chart-tool-panels.png" alt="Open Chart Tool Panels with button to close it on the middle left of the panels" constrained="true" centered="true" maxWidth="40%" toggledarkmode="true"></image-caption>
        <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Accessing Chart Tool Panels</figcaption>
    </figure>
</div>

The Chart Tool Panels are accessed by clicking on the button highlighted above. Note they can also be opened 
via configuration (see examples in this section) or programmatically through the Grid API, see [Open / Close Chart Tool Panels](#chart-tool-panel-api).

## Settings Tool Panel

The Settings Panel can be used to change the chart type and chart theme.

<figure style="flex: 3;">
    <image-caption src="integrated-charts-chart-tool-panels/resources/settings-panel.png" alt="Chart Settings Panel"  constrained="true" centered="true" maxWidth="30%" toggledarkmode="true"></image-caption>
    <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Settings Panel</figcaption>
</figure>

It is possible to configure which chart groups and chart types are included and in which order via the `chartToolPanelsDef` grid option: 

<api-documentation source='grid-options/properties.json' section='charts' names='["chartToolPanelsDef"]' ></api-documentation>

The full list of chart groups with the corresponding chart types are shown below:

<interface-documentation interfaceName="ChartGroupsDef" config='{"description":"", "asCode":true, "lineBetweenProps": false}'></interface-documentation>

<note>
The contents and order of chart menu items in the [Context Menu](../context-menu/) will match the `ChartGroupsDef` configuration.
</note>

The example below shows a subset of the provided chart groups with the chart types reordered. Note the following:

* Only the **Pie**, **Columns** and **Bar** chart groups are shown in the settings panel.
* Only the **Pie**, **Columns** and **Bar** chart groups are shown in the Context Menu when you right click the grid.
* Note the order of the chart groups and their chart types matches the order they are specified in `chartGroupsDef`.
* The Settings Panel is configured to be open by default via `defaultToolPanel: 'settings'`.

<grid-example title='Settings Tool Panel Customisation' name='settings-panel-customisation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Data Tool Panel

The Data Panel can be used to change the chart category and series.

<figure style="flex: 3;">
    <image-caption src="integrated-charts-chart-tool-panels/resources/data-panel.png" alt="Chart Data Panel" maxWidth="30%" constrained="true" centered="true" toggledarkmode="true"></image-caption>
    <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Data Panel</figcaption>
</figure>

It is possible to configure which groups are shown, the order in which they appear and whether they are opened by default via the `chartToolPanelsDef` grid option:

<api-documentation source='grid-options/properties.json' section='charts' names='["chartToolPanelsDef"]' ></api-documentation>

The default list and order of the Data Panel groups are as shown below:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        dataPanel: {
            groups: [
                { type: 'categories', isOpen: true },
                { type: 'series', isOpen: true },
                { type: 'seriesChartType', isOpen: true }
            ]
        }
    }
}
</snippet>

<note>
The `seriesChartType` group is only shown in [Combination Charts](../integrated-charts-api-range-chart/#combination-charts).
</note>

The following example shows some Data Panel customisations. Note the following:

* The **Categories** group is not included.
* The **Series** group is closed by default.
* The Data Panel is configured to be open by default via `defaultToolPanel: 'data'`.

<grid-example title='Data Tool Panel Customisation' name='data-panel-customisation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Format Tool Panel

The Format Panel allows users to format the chart where the available formatting options differ between chart types.

<figure style="flex: 3;">
    <image-caption src="integrated-charts-chart-tool-panels/resources/format-panel.png" alt="Chart Format Panel" maxWidth="30%" constrained="true" centered="true" toggledarkmode="true"></image-caption>
    <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Format Panel</figcaption>
</figure>

It is possible to configure which groups are shown, the order in which they appear and whether they are opened by default via the `chartToolPanelsDef` grid option:

<api-documentation source='grid-options/properties.json' section='charts' names='["chartToolPanelsDef"]' ></api-documentation>

The default list and order of format groups are as follows:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        formatPanel: {
            groups: [
                { type: 'chart', isOpen: false },
                { type: 'legend', isOpen: false },
                { type: 'axis', isOpen: false },
                { type: 'series', isOpen: false },
                { type: 'navigator', isOpen: false }
            ]
        }
    }
}
</snippet>

<note>
The selected chart determines which groups are displayed. For example, a pie chart does not have an axis so **Axis** groups will not be shown even if they are listed in `chartToolPanelsDef.formatPanel.groups`.
</note>

The following example shows some Format Panel customisations. Note the following:

* The format panel groups have been reordered.
* The **Axis** group is open by default.
* The **Navigator** group has been omitted.
* The Format Panel is configured to be open by default via `defaultToolPanel: 'format'`.

<grid-example title='Format Tool Panel Customisation' name='format-panel-customisation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Omitting & Ordering Tool Panels 

The Chart Tool Panels can be omitted and ordered using the `chartToolPanelsDef.panels` grid option:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        panels: ['data', 'format', 'settings'], // default order
    },
}
</snippet>

To hide the Chart Tool Panels, the `chartToolPanelsDef.panels` grid option can be set to an empty array:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        panels: [], // No Chart Tool Panels are shown and the button is also hidden
    },
}
</snippet>

The following example shows how the Chart Tool Panels can be omitted and ordered. Note the following:

* The **Format** Tool Panel has been omitted.
* The **Data** Tool Panel appears before the **Settings** Tool Panel.
* The Data Panel is configured to be open by default via `defaultToolPanel: 'data'`.

<grid-example title='Omitting & Ordering Tool Panels' name='omitting-ordering-tool-panels' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Chart Tool Panel API

The Chart Tool Panels can be opened and closed programmatically using the following grid APIs:

<api-documentation source='grid-api/api.json' section='charts' names='["openChartToolPanel", "closeChartToolPanel"]'></api-documentation>

The example below demonstrates how you can open and close the Chart Tool Panels.

- Click **Open Chart Tool Panel** to open the default `Settings` tab via `openChartToolPanel()`
- Click **Open Chart Tool Panel Format tab** to open the `Format` tab via `openChartToolPanel()`
- Click **Close Chart Tool Panel** to close via `closeChartToolPanel()`

<grid-example title='Open/Close Chart Tool Panel' name='chart-tool-panel-api' type='generated' options='{ "exampleHeight": 800, "enterprise": true, "modules": ["clientside", "menu", "charts"], "myGridReference": 1 }'></grid-example>

## Next Up

Continue to the next section to learn about the: [Chart Toolbar](/integrated-charts-toolbar/).
