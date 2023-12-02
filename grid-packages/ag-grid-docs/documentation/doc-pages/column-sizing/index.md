---
title: "Column Sizing"
---

All columns can be resized by dragging the top right portion of the column.

## Sizing

Column resizing is enabled by default for all columns. To control resizing for individual columns, set the boolean `resizable` property in the column definitions.

The snippet below allows all columns except Address to be resized.

<snippet>
const gridOptions = {
    columnDefs: [
        { field: 'name' },
        { field: 'age' },
        { field: 'address', resizable: false },
    ],
}
</snippet>

The snippet below shows how to only allow the Address column to be resized by setting `resizable=false` on the default column definition and then `resizable=true` on the Address column.

<snippet>
const gridOptions = {
    defaultColDef: {
        resizable: false,
    },
    columnDefs: [
        { field: 'name' },
        { field: 'age' },
        { field: 'address', resizable: true },
    ],
}
</snippet>

## Column Flex

It's often required that one or more columns fill the entire available space in the grid. For this scenario, it is possible to use the `flex` config. Some columns could be set with a regular `width` config, while other columns would have a flex config.

Flex sizing works by dividing the remaining space in the grid among all flex columns in proportion to their flex value. For example, suppose the grid has a total width of 450px and it has three columns: the first with `width: 150`; the second with `flex: 1`; and third with `flex: 2`. The first column will be 150px wide, leaving 300px remaining. The column with `flex: 2` has twice the size with `flex: 1`. So final sizes will be: 150px, 100px, 200px.

<note>
The flex config does **not** work with a `width` config
in the same column. If you need to provide a minimum width for a column,
you should use flex and the `minWidth` config. Flex will also take `maxWidth`
into account.
</note>

<note>
If you manually resize a column with flex either via the API or by dragging the resize handle,
flex will automatically be disabled for that column.
</note>

The example below shows flex in action. Things to note are as follows:

- Column A is fixed size. You can resize it with the drag handle and the other two columns will adjust to fill the available space
- Column B has `flex: 2`, `minWidth: 200` and `maxWidth: 350`, so it should be constrained to this max/min width.
- Column C has `flex: 1` so should be half the size of column B, unless column B is being constrained by its `minWidth`/`maxWidth` rules, in which case it should take up the remaining available space.


<grid-example title='Column Flex' name='flex-columns' type='generated'></grid-example>

## Auto-Sizing Columns

Columns can be auto-sized in two main ways:
1. Auto-size columns to fit grid - The columns will scale to fit the available grid width (or a provided width if desired).
1. Auto-size columns to fit cell contents - The columns will resize to fit their visible cell contents.

### Auto-Size Columns to Fit Grid

Columns can be resized to fit the width of the grid. The columns will scale (growing or shrinking) to fit the available width.

<grid-example title='Auto-Size Columns to Fit Grid' name='column-sizing-to-fit' type='generated'></grid-example>

Provide the grid option `autoSizeStrategy` to size the columns to fit when the grid is loaded. This can either be set to size to the actual grid width (`type = 'fitGridWidth'`), or to a fixed width that is provided (`type = 'fitProvidedWidth'`).

<snippet>
const gridOptions = {
    autoSizeStrategy: {
        type: 'fitGridWidth',
        defaultMinWidth: 100,
        columnLimits: [
            {
                colId: 'country',
                minWidth: 900
            }
        ]
    }
}
</snippet>

<api-documentation source='grid-options/properties.json' section='columnSizing' names='["autoSizeStrategy"]'></api-documentation>

The columns can also be sized on demand via `api.sizeColumnsToFit(params)`.

<api-documentation source='grid-api/api.json' section='columnSizing' names='["sizeColumnsToFit"]' ></api-documentation>

If you don't want a particular column to be included in the auto-resize, then set the column definition `suppressSizeToFit=true`. This is helpful if, for example, you want the first column to remain fixed width, but all other columns to fill the width of the table.

The grid calculates new column widths while maintaining the ratio of the column default widths. So for example
if Column A has a default size twice as wide as Column B, then after the sizing is performed, Column A
will still be twice the size of Column B, assuming no column min-width or max-width constraints are violated.

Column default widths, rather than current widths, are used while calculating the new widths. This ensures
the result is deterministic and does not depend on any column resizing the user may have manually done.

A parameters object can be provided with minimum and maximum widths, either for all columns or for specific columns, to further restrain the column's resulting width from that function call. These widths will not exceed the column's defined minimum and maximum widths.

<note>
|For example assuming a grid with three columns, the algorithm will be as follows:
|
|`scale = availableWidth / (w1 + w2 + w3)`
|
|`w1 = round(w1 * scale)`
|
|`w2 = round(w2 * scale)`
|
|`w3 = totalGridWidth - (w1 + w2)`
|
|Assuming the grid is 1,200 pixels wide and the columns have default widths of `50`, `120` and `300`,
|then the calculation is as follows:
|
|`availableWidth = 1,198` (available width is typically smaller as the grid typically has left and right borders)
|
|`scale = 1198 / (50 + 120 + 300) = 2.54`
|
|`col1 = round(50 * 2.54) = 127`
|
|`col2 = round(120 * 2.54) = 306`
|
|`col3 = 1198 - (127 + 306) = 765` (the last column gets any space that's left, which ensures all space is used, so no rounding issues)
</note>

### Auto-Size Columns to Fit Cell Contents

Columns can be resized to fit the contents of the cells.

<grid-example title='Auto-Size Columns to Fit Cell Contents' name='column-resizing' type='generated'></grid-example>

Provide the grid option `autoSizeStrategy` with `type = 'fitCellContents'` to size the columns to fit their content when the first data is rendered in the grid.

<snippet>
const gridOptions = {
    autoSizeStrategy: {
        type: 'fitCellContents'
    }
}
</snippet>

<api-documentation source='grid-options/properties.json' section='columnSizing' names='["autoSizeStrategy"]'></api-documentation>

This can also be performed on demand via the following API methods:

<api-documentation source='grid-api/api.json' section='columnSizing' names='["autoSizeColumn", "autoSizeColumns", "autoSizeAllColumns"]'></api-documentation>

Note that using `autoSizeStrategy` to fit cell contents only works for the Client-Side Row Model and Server-Side Row Model, but the API methods work for all row models.

By default the grid will also resize the column to fit the header. If you do not want the headers to be included in the auto-size calculation, set the grid property `skipHeaderOnAutoSize = true`, or pass `skipHeader = true` to the `autoSizeStrategy` params or the API method.

[Column Groups](/column-groups/) are never considered when calculating the column widths.

Just like Excel, each column can also be auto-resized by double clicking the right side of the header rather than dragging it. When you do this, the grid will work out the best width to fit the contents of the cells in the column.

Note the following:
- The grid works out the best width by considering the virtually rendered rows only. For example, if your grid has 10,000 rows, but only 50 rendered due to virtualisation of rows, then only these 50 will be considered for working out the width to display. The rendered rows are all the rows you can see on the screen through the vertical scroll plus a small buffer (default buffer size is 20).
- Only rendered cells on the screen are considered, and the grid works out the width based on what it sees. It cannot see the columns that are not rendered due to column virtualisation. Thus it is not possible to auto-size a column that is not visible on the screen.
- Column Virtualisation is the technique the grid uses to render large amounts of columns without degrading performance by only rendering columns that are visible due to the horizontal scroll positions. For example, the grid can have 1,000 columns with only 10 rendered if the horizontal scroll is only showing 10 columns.

To get around this, you can turn off column virtualisation by setting grid property `suppressColumnVirtualisation=true`. The choice is yours to decide whether you want column virtualisation working OR auto-size working using off-screen columns.

## Shift Resizing

If you hold the <kbd>⇧ Shift</kbd> key while dragging the resize handle, the column will take space away from the column adjacent to it. This means the total width for all columns will be constant.

You can also change the default behaviour for resizing. Set the grid property `colResizeDefault='shift'` to have shift resizing as the default and normal resizing to happen when the <kbd>⇧ Shift</kbd> key is pressed.

In the example below, note the following:

- Grid property `colResizeDefault='shift'` so default column resizing will behave as if <kbd>⇧ Shift</kbd> key is pressed.
- Holding down <kbd>⇧ Shift</kbd> will then resize the normal default way.

<grid-example title='Shift Resizing' name='shift-resizing' type='generated'></grid-example>

## Resizing Groups

When you resize a group, it will distribute the extra room to all columns in the group equally. In the example below the groups can be resized as follows:

- The group 'Everything Resizes' will resize all columns.
- The group 'Only Year Resizes' will resize only year, because the other columns have `resizable=false`.
- The group 'Nothing Resizes' cannot be resized at all because all the columns in the groups have `resizable=false`.

<grid-example title='Resizing Groups' name='resizing-groups' type='generated'></grid-example>
