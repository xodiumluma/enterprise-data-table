---
title: "Custom Icons"
---

This section details how to provide your own icons for the grid and style grid icons for your application requirements

## Swapping the Provided Icon Fonts

Each provided theme comes with its own icon font. It is simple to use one provided theme with another theme's icons. Set `--ag-icon-font-family` to one of: `agGridQuartz`, `agGridAlpine`, `agGridBalham` or `agGridMaterial`. You can compare the available icon fonts in the [Provided Icons list](#provided-icons).

If you are using the Sass API, it will embed the required font data for you. Apps using CSS should load the font's CSS file from whatever location they are loading `ag-grid.css` and other CSS files. For example to use the Material icons in the Quartz theme:

1. Load `agGridMaterialFont.css`
2. (optional) switch `ag-theme-quartz.css` for `ag-theme-quartz-no-font.css` to save a few kB if you no longer require the Quartz icons
3. Set the CSS variable `--ag-icon-font-family: agGridMaterial`

This example uses the Quartz theme with icons from the Material theme:

<grid-example title='Swapping the Icon Font' name='icons-swapping-font' type='generated' options='{ "enterprise": true, "modules": ["clientside", "rowgrouping", "menu", "setfilter", "columnpanel", "filterpanel"]  }'></grid-example>

## Using Alternative Icons

Grid icons can use an icon font or images. The grid exposes a number of CSS variables to control the icons. Each variable can optionally be suffixed with the name of a specific icon, and will affect only that icon, e.g. setting `--ag-icon-font-color-loading` sets the color of the "loading" icon.

Icon font variables:

  - `--ag-icon-font-family[-icon-name]` set the icon font family.
  - `--ag-icon-font-code[-icon-name]` set the unicode character of the icon within the icon font, using a unicode escape sequence like `"\f247"`.
  - `--ag-icon-font-weight[-icon-name]` sets the font weight, used for icon fonts that require a specific weight to work.
  - `--ag-icon-font-color[-icon-name]` set the color of the icon, or can be set to `transparent` to hide the icon font if you want to provide an image instead.

Icon image variables:
  - `--ag-icon-image[-icon-name]` set this to `url(/path/to/icon.svg)`
  - `--ag-icon-image-display[-icon-name]` set this to `none` to hide the icon image if you want to provide an font-based icon instead.

Other icon variables:

- `--ag-icon-size` sets the height and width of icons in pixels.

### Example: using an alternative icon font

This example demonstrates globally changing the icon font, and also selectively replacing individual icons:

```css
.ag-theme-quartz {
  /* replace all icons in the grid with icons from Font Awesome */
  --ag-icon-font-family: "Font Awesome 5 Free";
  --ag-icon-font-code-aggregation: "\f247";
  --ag-icon-font-code-arrows: "\f0b2";
  --ag-icon-font-code-asc: "\f062";
  /* ... and so on - because --ag-icon-font-family sets the font for
     all icons, a new code must be provided for every one. If you only
     wanted to replace some icons, use --ag-icon-font-family-{icon-name} */

  /* selectively replace the the group icon with one from Material Design Icons */
  --ag-icon-font-family-group: "Material Design Icons";
  --ag-icon-font-code-group: "\F0328";
  --ag-icon-font-color-group: red;
  --ag-icon-font-weight-group: normal;
}
```

<grid-example title='Alternative Icon Font' name='icons-alternative-font' type='generated' options='{ "enterprise": true, "modules": ["clientside", "rowgrouping", "menu", "setfilter", "columnpanel", "filterpanel"], "extras": ["fontawesome", "materialdesignicons"]  }'></grid-example>

### Example: SVG icons

This example demonstrates using the `--ag-icon-image-icon-name` variables to set an 

```css
.ag-theme-quartz {
  /* hide all font icons */
  --ag-icon-font-color: transparent;
  /* provide a SVG icon */
  --ag-icon-image-aggregation: url("https://www.ag-grid.com/example-assets/svg-icons/aggregation.svg");
  --ag-icon-image-arrows: url("https://www.ag-grid.com/example-assets/svg-icons/arrows.svg");
  --ag-icon-image-asc: url("https://www.ag-grid.com/example-assets/svg-icons/asc.svg");
  /* ... and so on - because --ag-icon-font-color:transparent hides all
     icons, an image must be provided for every one. If you only wanted
     to replace some icons, use --ag-icon-font-color-{icon-name} */
}
```

The following example replaces the grid's icons with SVG images:

<grid-example title='SVG Icons' name='icons-images' type='generated' options='{ "enterprise": true, "modules": ["clientside", "rowgrouping", "menu", "setfilter", "columnpanel", "filterpanel"], "extras": ["fontawesome", "materialdesignicons"]  }'></grid-example>

## Set the Icons Through gridOptions (JavaScript)

You can pass an `icons` property either on the [Grid Options](/grid-options/) to apply across the whole grid, or the [Column Definition](/column-properties/). If both are provided, icons specified at the column level will take priority.

The `icons` property takes an object of name/value pairs where the name is one of the icon names below (note that these are different from the CSS names above) and the value is one of:

- An HTML string to be inserted in place of the usual DOM element for an icon
- A function that returns either an HTML string or a DOM node

<grid-example title='Icon Grid Options' name='icons-grid-options' type='generated' options='{ "enterprise": true, "modules": ["clientside", "rowgrouping", "sidebar", "columnpanel", "filterpanel"], "exampleHeight": 660, "extras": ["fontawesome"] }'></grid-example>

In the following list, the name to use in the grid options is to the left, and on the right is the CSS icon name as listed in the [Provided Icons](#provided-icons) table below.

```js
// header column group shown when expanded (click to contract)
columnGroupOpened: 'expanded'
// header column group shown when contracted (click to expand)
columnGroupClosed: 'contracted'
// tool panel column group contracted (click to expand)
columnSelectClosed: 'tree-closed'
// tool panel column group expanded (click to contract)
columnSelectOpen: 'tree-open'
// column tool panel header expand/collapse all button, shown when some children are expanded and
//     others are collapsed
columnSelectIndeterminate: 'tree-indeterminate'
// shown on ghost icon while dragging column to the side of the grid to pin
columnMovePin: 'pin'
// shown on ghost icon while dragging over part of the page that is not a drop zone
columnMoveHide: 'eye-slash'
// shown on ghost icon while dragging columns to reorder
columnMoveMove: 'arrows'
// animating icon shown when dragging a column to the right of the grid causes horizontal scrolling
columnMoveLeft: 'left'
// animating icon shown when dragging a column to the left of the grid causes horizontal scrolling
columnMoveRight: 'right'
// shown on ghost icon while dragging over Row Groups drop zone
columnMoveGroup: 'group'
// shown on ghost icon while dragging over Values drop zone
columnMoveValue: 'aggregation'
// shown on ghost icon while dragging over pivot drop zone
columnMovePivot: 'pivot'
// shown on ghost icon while dragging over drop zone that doesn't support it, e.g.
//     string column over aggregation drop zone
dropNotAllowed: 'not-allowed'
// shown on row group when contracted (click to expand)
groupContracted: 'tree-closed'
// shown on row group when expanded (click to contract)
groupExpanded: 'tree-open'
// set filter tree list group contracted (click to expand)
setFilterGroupClosed: 'tree-closed',
// set filter tree list group expanded (click to contract)
setFilterGroupOpen: 'tree-open',
// set filter tree list expand/collapse all button, shown when some children are expanded and
//     others are collapsed
setFilterGroupIndeterminate: 'tree-indeterminate',
// context menu chart item
chart: 'chart'
// chart window title bar
close: 'cross'
// X (remove) on column 'pill' after adding it to a drop zone list
cancel: 'cancel'
// indicates the currently active pin state in the "Pin column" sub-menu of the column menu
check: 'tick'
// "go to first" button in pagination controls
first: 'first'
// "go to previous" button in pagination controls
previous: 'previous'
// "go to next" button in pagination controls
next: 'next'
// "go to last" button in pagination controls
last: 'last'
// shown on top right of chart when chart is linked to range data (click to unlink)
linked: 'linked'
// shown on top right of chart when chart is not linked to range data (click to link)
unlinked: 'unlinked'
// "Choose colour" button on chart settings tab
colorPicker: 'color-picker'
// rotating spinner shown by the loading cell renderer
groupLoading: 'loading'
// button to launch enterprise column menu
menu: 'menu'
// filter tool panel tab
filter: 'filter'
// column tool panel tab
columns: 'columns'
// button in chart regular size window title bar (click to maximise)
maximize: 'maximize'
// button in chart maximised window title bar (click to make regular size)
minimize: 'minimize'
// "Pin column" item in column header menu
menuPin: 'pin'
// "Value aggregation" column menu item (shown on numeric columns when grouping is active)"
menuValue: 'aggregation'
// "Group by {column-name}" item in column header menu
menuAddRowGroup: 'group'
// "Un-Group by {column-name}" item in column header menu
menuRemoveRowGroup: 'group'
// context menu copy item
clipboardCopy: 'copy'
// context menu cut item
clipboardCut: 'cut'
// context menu paste item
clipboardPaste: 'paste'
// identifies the pivot drop zone
pivotPanel: 'pivot'
// "Row groups" drop zone in column tool panel
rowGroupPanel: 'group'
// columns tool panel Values drop zone
valuePanel: 'aggregation'
// drag handle used to pick up draggable columns
columnDrag: 'grip'
// drag handle used to pick up draggable rows
rowDrag: 'grip'
// context menu export item
save: 'save'
// csv export
csvExport: 'csv'
// excel export
excelExport: 'excel'
// icon on dropdown editors
smallDown: 'small-down'
// version of small-right used in RTL mode
smallLeft: 'small-left'
// separater between column 'pills' when you add multiple columns to the header drop zone
smallRight: 'small-right'
smallUp: 'small-up'
// show on column header when column is sorted ascending
sortAscending: 'asc'
// show on column header when column is sorted descending
sortDescending: 'desc'
// show on column header when column has no sort, only when enabled with gridOptions.unSortIcon=true
sortUnSort: 'none',
// Builder button in Advanced Filter
advancedFilterBuilder: 'group',
// drag handle used to pick up Advanced Filter Builder rows
advancedFilterBuilderDrag: 'grip',
// Advanced Filter Builder row validation error
advancedFilterBuilderInvalid: 'not-allowed',
// shown on Advanced Filter Builder rows to move them up
advancedFilterBuilderMoveUp: 'up',
// shown on Advanced Filter Builder rows to move them down
advancedFilterBuilderMoveDown: 'down',
// shown on Advanced Filter Builder rows to add new rows
advancedFilterBuilderAdd: 'plus',
// shown on Advanced Filter Builder rows to remove row
advancedFilterBuilderRemove: 'minus',
```

## Provided Icons

Below you can see a list with all available icons for each provided theme. The name next to each icon is the CSS name, e.g. the `pin` icon will have the CSS class `ag-icon-pin` and uses the CSS variable `--ag-icon-font-code-pin`.

<icons-panel></icons-panel>
