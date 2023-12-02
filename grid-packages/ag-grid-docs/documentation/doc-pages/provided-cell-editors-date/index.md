---
title: "Date Cell Editors"
---

Two date cell editors are provided - `agDateCellEditor` for cell values provided as [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date), and `agDateStringCellEditor` for date values provided as [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

## Enabling Date Cell Editor

Edit any of the cells in the grid below to see the Date Cell Editor.

 <grid-example title='Date Editor' name='date-editor' type='generated' options='{ "modules": ["clientside"] }'></grid-example>

The Date Cell Editor is a simple date editor that uses the standard HTML date input and requires cell values to be of type [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

Enabled with `agDateCellEditor` and configured with `IDateCellEditorParams`.

```js
columnDefs: [
    {
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
            min: '2000-01-01',
            min: '2019-12-31',
        }
        // ...other props
    }
]
```

### API Reference

<interface-documentation interfaceName='IDateCellEditorParams' names='["min","max","step"]'></interface-documentation>

## Enabling Date as String Cell Editor

Edit any of the cells in the grid below to see the Date as String Cell Editor.

<grid-example title='Date as String Editor' name='date-as-string-editor' type='generated' options='{ "modules": ["clientside"] }'></grid-example>

The Date as String Cell Editor is a simple date editor that uses the standard HTML date input. It's similar to the Date Cell Editor, but works off of cell values with type [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

The date format is controlled via [Cell Data Types](/cell-data-types/) and the [Date as String Data Type Definition](/cell-data-types/#date-as-string-data-type-definition). The default is `'yyyy-mm-dd'`.

Enabled with `agDateStringCellEditor` and configured with `IDateStringCellEditorParams`.

```js
columnDefs: [
    {
        cellEditor: 'agDateStringCellEditor',
        cellEditorParams: {
            min: '2000-01-01',
            min: '2019-12-31',
        }
        // ...other props
    }
]
```

### API Reference

<interface-documentation interfaceName='IDateStringCellEditorParams' names='["min","max","step"]'></interface-documentation>


## Next Up

Continue to the next section: [Checkbox Cell Editor](../provided-cell-editors-checkbox/).

