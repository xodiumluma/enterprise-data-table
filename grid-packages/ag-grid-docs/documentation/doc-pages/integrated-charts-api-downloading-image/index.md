---
title: "Chart Image Export"
enterprise: true
---

This section shows how to export charts via the Chart Toolbar and Grid API.

## Export Charts via Chart Toolbar

Users can use the 'Download Chart' [Chart Toolbar](/integrated-charts-toolbar/) item to download the rendered
chart in the browser.

<div style="display: flex; margin-bottom: 25px; margin-top: 25px; margin-left: 40px;">
    <div style="flex: 1 1 0">
        <image-caption src="integrated-charts-api-downloading-image/resources/chart-toolbar-download.png" alt="Chart Toolbar Download button" constrained="true" centered="true" toggledarkmode="true"></image-caption>
    </div>
</div>

Note that the downloaded chart image will be in a `PNG` format.

## Export Charts via Grid API

There are two ways to download the chart image using the Grid API as shown below:

<api-documentation source='grid-api/api.json' section='charts' names='["downloadChart", "getChartImageDataURL"]'></api-documentation>

You can use the `downloadChart(params)` API to download the chart image in the browser.

Alternatively for programmatic use-cases, the `getChartImageDataURL(params)` API returns the chart
image as string (base64 encoded); this is ideal for  persisting to a back-end, or opening/presenting
the chart image statically.

The example below demonstrates how you can retrieve images rendered from the chart in multiple formats.

- Click **Download Chart Image (PNG)** to download a PNG format image via `getChartImageDataURL()`
- Click **Download Chart Image (JPG 800x500)** to download a custom size image via `downloadChart()`
- Click **Open Chart Image (JPG)** to open a JPEG format image in a new window via `getChartImageDataURL()`

<grid-example title='Downloading Chart Image' name='downloading-chart-image' type='generated' options='{ "exampleHeight": 800, "enterprise": true, "modules": ["clientside", "menu", "charts"], "myGridReference": 1 }'></grid-example>



