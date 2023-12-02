---
title: "Column Overview"
---

Columns are the key configuration point for controlling how data is displayed and interacted with inside the grid. 

## Column Options

Column Options, also known as column definitions, implement the `ColDef<TData, TValue>` or `ColGroupDef<TData>` interfaces and control all aspects of how a column behaves in the grid.

See [Column Options](/column-properties/) for a complete list of configuration options.

## Column

Each column in the grid is represented by a `Column` instance, which has a reference to the underlying column definition. The `Column` has attributes, methods and events for interacting with the specific column e.g. `column.isVisible()`.

See [Column](/column-object/)  for a complete list of attributes / methods associated with columns.

## Column Events

Columns fire events as they are updated which makes it possible to trigger logic in your application. 

<note>
Most users will not need to use Column Events but they are made available for advanced use cases. Please consider the guidance below.
</note>

### Column Event Guidance

All events fired by the column are synchronous (events are normally asynchronous). The grid is also listening for these events internally. This means that when you receive an event, the grid may still have some work to do (e.g. if sort has changed, the grid UI may still have to do the sorting). 

It is recommended to **not** call any grid API functions while receiving events from the `column`. Instead, it is best to put your logic into a timeout and call the grid in another VM tick.

When adding event listeners to a column, they will stay with the column until the column is destroyed. Columns are destroyed when you add new columns to the grid. Column objects are NOT destroyed when the columns is removed from the DOM (e.g. column virtualisation removes the column due to horizontal scrolling, or the column is made invisible via the column API).

If you add listeners to columns in custom header components, be sure to remove the listener when the header component is destroyed.

```js
// add visibility listener to 'country' column
const listener = event => console.log('Column visibility changed', event);

const column = api.getColumn('country');
column.addEventListener('visibleChanged', listener);

// sometime later, remove the listener
column.removeEventListener('visibleChanged', listener);
```