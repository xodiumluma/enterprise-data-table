---
title: "Row Grouping - Locking Group Columns"
enterprise: true
---
This section covers Locking Group Columns which restricts users from ungrouping or rearranging group ordering.  

By default, when no `groupLockGroupColumns` option is specified or if `groupLockGroupColumns = 0` is specified, then no group column locking will be applied. 

## Locking Single Group Column

To lock group columns, provide the number of group columns to lock to the grid option `groupLockGroupColumns`. For example, to lock the first group column, you can specify `groupLockGroupColumns = 1`  as shown below:

<snippet spaceBetweenProperties="true">
|  const gridOptions = { 
|      columnDefs: [
|          { field: 'country', rowGroup: true, enableRowGroup: true, },
|          { field: 'year', rowGroup: true, enableRowGroup: true },
|          { field: 'sport', rowGroup: true, enableRowGroup: true },
|          { field: 'gold' },
|          { field: 'silver' },
|          { field: 'bronze' },
|      ],
|
|      // possible options: '-1', '0', '1', '2', '3', etc...
|      groupLockGroupColumns: 1,
|  }
</snippet>

<grid-example title='Locking One Group Column' name='locking-one-group-column' type='generated' options='{ "enterprise": true, "exampleHeight": 540, "modules": ["clientside", "rowgrouping", "menu"] }'></grid-example>

Note in the example above the following:

- There are three active row groups as the supplied `country`, `year` and `sport` column definitions have `rowGroup=true` declared.

- Group Column locking has only been applied to the first group column `country`.

- Only `year` and `sport` columns can be rearranged or removed. While `country` cannot be rearranged or removed.

- The option to `Un-Group All` from the Group Column's context menu is displayed but clicking it doesn’t ungroup the `Country` group as it's locked - it only ungroups any other groups.

## Locking Multiple Group Columns

To lock multiple group columns, you can either specify the number of group columns to lock or you can provide the value `groupLockGroupColumns = -1`, which will lock all group columns.

For example, to lock the first two group columns, you can specify `groupLockGroupColumns = 2`:

<snippet spaceBetweenProperties="true">
|  const gridOptions = { 
|      columnDefs: [
|          { field: 'country', rowGroup: true, enableRowGroup: true, },
|          { field: 'year', rowGroup: true, enableRowGroup: true },
|          { field: 'sport', rowGroup: true, enableRowGroup: true },
|          { field: 'gold' },
|      ],
|      groupLockGroupColumns: 2,
|      groupDisplayType: 'multipleColumns',
|  }
</snippet>

<grid-example title='Locking Multiple Group Columns' name='locking-multiple-group-columns' type='generated' options='{ "enterprise": true, "exampleHeight": 540, "modules": ["clientside", "rowgrouping", "menu"] }'></grid-example>

Note in the example above the following:

- There are three active row groups as the supplied `country`, `year` and `sport` column definitions have `rowGroup=true` declared.

- Group Column locking has been applied to the first two group column `country` and `year`.

- As the example has `groupDisplayType='multipleColumns'`, it is possible to `Un-Group by Sport` via the Sport Column's context menu. The column menus for the `Country` and `Year` columns include the `Un-group by Country` and `Un-group by Year` menu options, but as Country and Year columns are locked, these menu items are disabled.


## Next Up

Continue to the next section to learn how to add [Group Order](../grouping-group-order/).