---
title: "Cell Renderer"
---

<framework-specific-section frameworks="javascript">
|By default the grid will create the cell values using simple text. If you want more complex HTML inside the cells you can achieve this using Cell Renderers.
</framework-specific-section>

<framework-specific-section frameworks="vue">
|By default the grid will create the cell values using simple text. If you want more complex HTML inside the cells you can achieve this using Cell Renderers.
</framework-specific-section>

<framework-specific-section frameworks="react">
<video-section id="9IbhW4z--mg" title="React Cell Renderers" header="true">
By default the grid will create the cell values using simple text. If you want more complex HTML inside the cells you can achieve this using Cell Renderers.
</video-section>
</framework-specific-section>

<framework-specific-section frameworks="angular">
<video-section id="xsafnM77NVs" title="Angular Cell Renderers" header="true">
By default the grid will create the cell values using simple text. If you want more complex HTML inside the cells you can achieve this using Cell Renderers.
</video-section>
</framework-specific-section>


The example below uses a Cell Renderer to render a hash (`#`) symbol for each medal won
(instead of the medal count), and a cell with a button in the `Total` column:

<grid-example title='Simple Cell Renderer' name='simple' type='mixed' options='{ "exampleHeight": 460 }'></grid-example>

md-include:component-interface-javascript.md
md-include:component-interface-angular.md
md-include:component-interface-react.md
md-include:component-interface-vue.md

<interface-documentation interfaceName='ICellRendererParams' config='{"hideHeader":false, "headerLevel": 3}' ></interface-documentation>

md-include:params_vue.md

## Registering Cell Renderers with Columns

See the section [registering custom components](/components/#registering-custom-components) for details on registering and using custom Cell Renderers.

## Component Refresh

Component Refresh needs a bit more explanation. Here we go through some of the finer details.

### Events Causing Refresh

<framework-specific-section frameworks="javascript,angular,vue">
| The grid can refresh the data in the browser, but not every refresh / redraw of the grid results in the refresh method
| of your cell renderer getting called. The following items are those that **do** cause refresh to be called:
|
| - Calling `rowNode.setDataValue(colKey, value)` to set a value directly onto the `rowNode`. This is the preferred API way to change one value from outside of the grid.
| - When editing a cell and editing is stopped, so that cell displays new value after editing.
| - Calling `api.refreshCells()` to inform grid data has changed (see [Refresh](/view-refresh/)).
|
| If any of the above occur and the grid confirms the data has changed via [Change Detection](/change-detection/), then the `refresh()` method will be called.
</framework-specific-section>

<framework-specific-section frameworks="react">
|When the grid can refresh a cell (instead of replacing it altogether) then the update will occur as follows:
|
|- For class components, `componentWillReceiveProps`, `getDerivedStateFromProps` will get called and the function re-rendered.
|- For functional components, the function will get called again with new props.
|
|The grid can refresh the data in the browser, but not every refresh / redraw of the grid results in the refresh of your cell renderer.
|
|The following items are those that **do** cause refresh to be called:
|
|- Calling `rowNode.setDataValue(colKey, value)` to set a value directly onto the `rowNode`. This is the preferred API way to change one value from outside the grid.
|- When editing a cell and editing is stopped, so that cell displays new value after editing.
|- Calling `api.refreshCells()` to inform grid data has changed (see [Refresh](/view-refresh/)).
|
|If any of the above occur and the grid confirms the data has changed via [Change Detection](/change-detection/), then the Cell Renderer is refreshed.
</framework-specific-section>

The following will **not** result in the cell renderer's refresh method being called:

- Calling `rowNode.setData(data)` to set new data into a `rowNode`. When you set the data for the whole row, the whole row in the DOM is recreated again from scratch.
- Scrolling the grid vertically causes columns (and their containing cells) to be removed and inserted due to column virtualisation.

All of the above will result in the component being destroyed and recreated.

### Grid vs Component Refresh

<framework-specific-section frameworks="javascript,angular,vue">
| The refresh method returns back a boolean value. If you do not want to handle the refresh in the cell renderer, just return back `false` from an otherwise empty method. This will indicate to the grid that you did not refresh and the grid will instead destroy the component and create another instance of your component from scratch instead.
</framework-specific-section>

<framework-specific-section frameworks="react">
|If you choose to implement the `refresh` method, then note that this method returns a boolean value. If you do not
|want to handle the refresh in the cell renderer, just return `false` from an otherwise empty method. This will
|indicate to the grid that you did not refresh and the grid will instead destroy the component and create another instance of your component from scratch instead.
</framework-specific-section>

The example below demonstrates handling the refresh, where the Gold, Silver and Bronze column cell renderers refresh when the Update Data button is clicked.

<grid-example title='Component Refresh' name='component-refresh' type='mixed'></grid-example>

### Change Detection

As mentioned in the section on [Change Detection](/change-detection/), the refresh of the Cell will not take place if the value getting rendered has not changed.

md-include:component-lifecycle-javascript.md
md-include:component-lifecycle-angular.md
md-include:component-lifecycle-react.md
md-include:component-lifecycle-vue.md

## Cell Rendering Flow

The diagram below (which is taken from the section [Cell Content](/cell-content/)) summarises the steps the grid takes while working out what to render and how to render.

In short, a value is prepared. The value comes using either the `colDef.field` or the `colDef.valueGetter`. The value is also optionally passed through a `colDef.valueFormatter` if it exists. Then the value is finally placed into the DOM, either directly, or by using the chosen `colDef.cellRenderer`.

<framework-specific-section frameworks="javascript">
<image-caption src='value-getters/resources/valueGetterFlow.svg' width="55rem" centered="true" alt='Value Getter Flow' constrained='true' filterdarkmode="true"></image-caption>
</framework-specific-section>

<framework-specific-section frameworks="angular,react,vue">
<image-caption src='resources/valueGetterFlowFw.svg' width="55rem" centered="true" alt='Value Getter Flow' constrained='true' filterdarkmode="true"></image-caption>
</framework-specific-section>

## Complementing Cell Renderer Params
 
On top of the parameters provided by the grid, you can also provide your own parameters. This is useful if you want to
'configure' your Cell Renderer. For example, you might have a Cell Renderer for formatting currency but you need to
provide what currency for your cell renderer to use.

Provide params to a cell renderer using the colDef option `cellRendererParams`.

md-include:complementing-component-javascript.md
md-include:complementing-component-angular.md
md-include:complementing-component-react.md
md-include:complementing-component-vue.md
 
## Data in Cell Renderers

Sometimes the `data` property in the parameters given to a cell renderer might not be populated. This can happen for
example when using row grouping (where the row node has `aggData` and `groupData` instead of `data`), or when rows are
being loaded in the [Infinite Row Model](/infinite-scrolling/) and do not yet have data. It is best to check that data
does exist before accessing it in your cell renderer, for example:

md-include:data-in-renderer-javascript.md
md-include:data-in-renderer-angular.md
md-include:data-in-renderer-react.md
md-include:data-in-renderer-vue.md

md-include:renderer-function-javascript.md
md-include:renderer-function-angular.md
md-include:renderer-function-vue.md 
 
<framework-specific-section frameworks="javascript">
<note>
| You might be wondering how the grid knows if you have provided a Cell Renderer component class or
| a simple function, as JavaScript uses functions to implement classes. The answer is the grid looks
| for the `getGui()` method in the prototype of the function (a mandatory method in the cell renderer
| interface). If the `getGui()` method exists, it assumes a component, otherwise it assumes a function.
</note>
</framework-specific-section>
 
## Complex Cell Renderer Example

The example below shows five columns formatted, demonstrating each of the methods above.

- 'Month' column uses `cellStyle` to format each cell in the column with the same style.
- 'Max Temp' and 'Min Temp' columns uses the Function method to format each cell in the column with the same style.
- 'Days of Air Frost' column uses the Component method to format each cell in the column with the same style
- 'Days Sunshine' and 'Rainfall (10mm)' use simple functions to display icons.

<grid-example title='Cell Renderer' name='cell-renderer' type='mixed'></grid-example>

## Custom Group Cell Renderer Example

The example below demonstrates how to implement a simple custom group cell renderer.

- The example has a custom icon which represents whether the group is open
- Reacts to the row events if the group is expanded from another source
- Cleans up event listeners when it's disposed of

<grid-example title='Group Renderers' name='custom-group-renderer' type='mixed' options='{"enterprise": true, "modules": ["clientside", "rowgrouping"]}'></grid-example>

## Accessing Cell Renderer Instances

After the grid has created an instance of a cell renderer for a cell it is possible to access that instance. This is useful if you want to call a method that you provide on the cell renderer that has nothing to do with the operation of the grid. Accessing cell renderers is done using the grid API `getCellRendererInstances(params)`.

<api-documentation source='grid-api/api.json' section='rendering' names='["getCellRendererInstances"]' ></api-documentation>

An example of getting the cell renderer for exactly one cell is as follows:

<snippet transform={false}>
|// example - get cell renderer for first row and column 'gold'
|const firstRowNode = api.getDisplayedRowAtIndex(0);
|const params = { columns: ['gold'], rowNodes: [firstRowNode] };
|const instances = api.getCellRendererInstances(params);
|
|if (instances.length > 0) {
|    // got it, user must be scrolled so that it exists
|    const instance = instances[0];
|}
</snippet>

Note that this method will only return instances of the cell renderer that exists. Due to row and column virtualisation, renderers will only exist for cells that the user can actually see due to horizontal and vertical scrolling.

The example below demonstrates custom methods on cell renderers called by the application. The following can be noted:

- The medal columns are all using the user defined `MedalCellRenderer`. The cell renderer has an arbitrary method `medalUserFunction()` which prints some data to the console.
- The **Gold** method executes a method on all instances of the cell renderer in the gold column.
- The **First Row Gold** method executes a method on the gold cell of the first row only. Note that the `getCellRendererInstances()` method will return nothing if the grid is scrolled far past the first row showing row virtualisation in action.
- The **All Cells** method executes a method on all instances of all cell renderers.

<grid-example title='Get Cell Renderer' name='get-cell-renderer' type='generated'></grid-example>

<framework-specific-section frameworks="react">
<note>
Note that the hook version of the above example makes use of `useImperativeHandle` to expose methods to the grid (and other components). Please
refer to the [hook specific](../react-hooks/) documentation for more information.
</note>
</framework-specific-section>

<framework-specific-section frameworks="angular">
|### Example: Rendering using more complex Components
|This example illustrates a few different ideas:
|- Custom Cell Renderers
|- Parent/Child Communication using [context](/context/)
|- Storing the Grid API via the "Grid Ready" event, and using it later
</framework-specific-section>
<framework-specific-section frameworks="angular">
<grid-example title='Simple Dynamic Component' name='dynamic-components' type='mixed' options='{ "extras": ["fontawesome"] }'></grid-example>
</framework-specific-section>

<framework-specific-section frameworks="react">
|### Example: Rendering using more complex Components
|This example illustrates a few different ideas:
|- Custom Cell Renderers
|- Parent/Child Communication using [context](/context/)
|- Using a `ref` to access `AgGridReact` in order to access the underlying APIs
</framework-specific-section>
<framework-specific-section frameworks="react">
<grid-example title='Simple Dynamic Component' name='dynamic-components' type='mixed' options='{ "extras": ["fontawesome"] }'></grid-example>
</framework-specific-section>

<framework-specific-section frameworks="vue">
|### Example: Rendering using more complex Components
|This example illustrates a few different ideas:
|- Custom Cell Renderers
|- Parent/Child Communication using [context](/context/)
|- Storing the Grid API via the "Grid Ready" event, and using it later
</framework-specific-section>
<framework-specific-section frameworks="vue">
<grid-example title='Simple Dynamic Component' name='dynamic-components' type='mixed' options='{ "extras": ["fontawesome"] }'></grid-example>
</framework-specific-section>

<framework-specific-section frameworks="angular">
| ### Example: Rendering using nested Modules
|
| Using more complex Angular Components in the Cell Renderers - specifically how you can use nested `NgModule`'s within the grid.
</framework-specific-section>
<framework-specific-section frameworks="angular">
<grid-example title='Richer Dynamic Components' name='angular-rich-dynamic' type='angular' options='{ "exampleHeight": 380 }'></grid-example>
</framework-specific-section>

## Cell Renderer Keyboard Navigation

When using custom cell renderers, the custom cell renderer is responsible for implementing support for keyboard navigation among its focusable elements. This is why by default, focusing a grid cell with a custom cell renderer will focus the entire cell instead of any of the elements inside the custom cell renderer. 

Adding support for keyboard navigation and focus requires a custom `suppressKeyboardEvent` function in grid options. See [Suppress Keyboard Events](/keyboard-navigation/#suppress-keyboard-events).

An example of this is shown below, enabling keyboard navigation through the custom cell elements when pressing <kbd>⇥ Tab</kbd> and <kbd>⇧ Shift</kbd>+<kbd>⇥ Tab</kbd>:

- Click on the top left `Natalie Coughlin` cell, press the <kbd>⇥ Tab</kbd> key and notice that the button, textbox and link can be tabbed into. At the end of the cell elements, the tab focus moves to the next cell in the next row
- Use <kbd>⇧ Shift</kbd>+<kbd>⇥ Tab</kbd> to navigate in the reverse direction

The `suppressKeyboardEvent` callback is used to capture tab events and determine if the user is tabbing forward or backwards. It also suppresses the default behaviour of moving to the next cell if tabbing within the child elements. 

If the focus is at the beginning or the end of the cell children and moving out of the cell, the keyboard event is not suppressed, so focus can move between the children elements. Also, when moving backwards, the focus needs to be manually set while preventing the default behaviour of the keyboard press event.

<grid-example title='Cell Renderer Keyboard Navigation' name='cell-renderer-keyboard-navigation' type='mixed'></grid-example>

