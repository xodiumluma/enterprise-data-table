---
title: "Chart Toolbar"
enterprise: true
---

The chart toolbar allows users to unlink charts from the grid and download the current chart.   

<figure>
    <img src="resources/chart-toolbar.png" alt="Chart Toolbar" />
    <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Toolbar</figcaption>
</figure>

## Unlinking Charts

Charts are linked to the data in the grid by default, so that if the data changes, the chart will also update. However, it is sometimes desirable to unlink a chart from the grid data. For instance, users may want to prevent a chart from being updated when subsequent sorts and filters are applied in the grid.

Unlinking a chart is achieved through the 'Unlink Chart' toolbar item highlighted below:

<div style="display: flex; margin-bottom: 25px; margin-top: 25px; margin-left: 40px; gap: 40px">
    <figure style="flex: 1; margin: 0;">
        <img src="resources/chart-toolbar-link-chart.png" alt="Chart Toolbar Link button with linked data"/>
        <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Toolbar Link button with linked data</figcaption>
    </figure>
    <figure style="flex: 1; margin: 0;">
        <img src="resources/chart-toolbar-unlink-chart.png" alt="Chart Toolbar Link button with unlinked data"/>
        <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Toolbar Link button with unlinked data</figcaption>
    </figure>
</div>

Notice that the chart range disappears from the grid when the chart has been unlinked. Subsequent changes to the grid sorting also do not impact the chart.

## Downloading Charts

The 'Download Chart' toolbar item will download the chart as a `PNG` file. Note that the chart is drawn using Canvas in the browser and as such the user can also right click on the chart and save just like any other image on a web page.

<figure>
    <img src="resources/chart-toolbar-download.png" alt="Chart Toolbar Download Chart button"/>
    <figcaption style="text-align: center; font-size: 0.85rem; margin-top: 10px;">Chart Toolbar Download Chart button</figcaption>
</figure>

The chart can also be [downloaded using the Grid API](/integrated-charts-api-downloading-image).

## Toolbar Customisation

The Chart Toolbar items can be omitted and ordered using the `getChartToolbarItems()` grid callback which can return 
which toolbar items should be shown and the order in which they appear: 

<snippet>
| const gridOptions = { 
|     getChartToolbarItems: () => ['chartUnlink', 'chartDownload'] // default items and order
| }
</snippet>

The example below shows how the toolbar can be customised to only show the 'Download Chart' toolbar item.

<grid-example title='Toolbar Customisation' name='toolbar-customisation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Next Up

Continue to the next section to learn about the: [Chart Container](/integrated-charts-container/).