---
title: "Excel Export - Multiple Sheets"
enterprise: true
---

Excel Export provides a way to export an Excel file with multiple sheets. This can be useful when you need to export data from different grids into a single Excel file.

## How it works

Exporting the grid into different sheets follows a specific process:

1. You start the process by calling the `getSheetDataForExcel` method on a grid instance to get the data exported for a specific sheet. 
1. You call this method multiple times either on the same grid with different data (or different export params) or on different instances of the grid, and you store each exported data set as an element of an Array. 
1. Once all the needed sheets have been stored in the Array, call the `exportMultipleSheetsAsExcel` or `getMultipleSheetsAsExcel` methods to package them in a single Excel workbook.

<note>
When using modules, the `exportMultipleSheetsAsExcel` and `getMultipleSheetsAsExcel` functions can be imported directly from the `excel-export` module as `import { exportMultipleSheetsAsExcel, getMultipleSheetsAsExcel } from '@ag-grid-enterprise/excel-export'`.
</note>

<warning>
| Calling `getSheetDataForExcel` starts a **Multiple Sheet** export process, that can only be ended by calling the `exportMultipleSheetsAsExcel` or `getMultipleSheetsAsExcel` methods. Until one of these two methods is called to complete the process, no data can be exported from the grid using `exportDataAsExcel` or `getDataAsExcel`.
</warning>

## Using Selected Rows
In this example, we use the `onlySelected=true` property to segment the grid data into multiple sheets, each containing 100 data rows.

Note the following: 

- The header is exported on each page, so each page will contain 101 records (including the header).
- Because each export did not have a specified `sheetName`, they will be named `ag-grid`, `ag-grid_1`, `ag-grid_2` and so on.

<grid-example title='Excel Export - Multiple Sheets with Data Selection' name='excel-export-multiple-sheets-selected' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "excel"]}'></grid-example>

## Using Data Filtering

In this example, we filter on the sport column to segment the grid data into multiple sheets, each containing all the data for a specific sport value.

Note the following: 

- The exported Excel file will contain one sheet for each sport result.
- Each sheet was exported using the sport name as the name of the sheet.

<grid-example title='Excel Export - Multiple Sheets with Filtered Data' name='excel-export-multiple-sheets-by-filter' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "excel", "setfilter"] }'></grid-example>

## Multiple Grids to Multiple Sheets

In this example, we export two grids, each into a separate sheet of the same Excel file. Drag a few rows from the grid on the left into the grid on the right and click the export button above the grid.

Note the following:

- The contents of the `Athletes` grid will be exported to the `Athletes` sheet.
- The contents of the `Selected Athletes` grid will be exported to the `Selected Athletes` sheet.
- Only the `onExcelExport` method is relevant to **Excel Export**

<grid-example title='Excel Export - Multiple Sheets with Multiple Grids' name='excel-export-multiple-sheets-multiple-grids' type='mixed' options='{ "enterprise": true, "modules": ["clientside", "menu", "excel"], "extras": ["fontawesome"] }'></grid-example>

## API

### API Methods

<api-documentation source='grid-api/api.json' section='export' names='["getSheetDataForExcel", "getMultipleSheetsAsExcel", "exportMultipleSheetsAsExcel"]'></api-documentation>

## Next Up

Continue to the next section: [Rows](../excel-export-rows/).