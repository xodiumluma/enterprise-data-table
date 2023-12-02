---
title: "Grid State"
---

This section covers saving and restoring the grid state, such as the filter model, selected rows, etc.

## Saving and Restoring State

<grid-example title='Grid State' name='grid-state' type='mixed' options='{ "enterprise": true, "exampleHeight": 630, "modules": ["clientside", "columnpanel", "filterpanel", "setfilter", "range"] }'></grid-example>

The initial state is provided via the grid option `initialState`. It is only read once when the grid is created.

<snippet>
const gridOptions = {
    initialState: {
        filter: {
            filterModel: { 
                year: {
                    filterType: 'set',
                    values: ['2012'],
                }
            }
        },
        columnVisibility: {
            hiddenColIds: ['athlete'],
        },
        rowGroup: {
            groupColIds: ['athlete'],
        }
    }
}
</snippet>

The current grid state can be retrieved by listening to the state updated event, which is fired with the latest state when it changes, or via `api.getState()`.

The state is also passed in the [Grid Pre-Destroyed Event](/grid-lifecycle/#grid-pre-destroyed), which can be used to get the state when the grid is destroyed.

<api-documentation source='grid-events/events.json' section='miscellaneous' names='["stateUpdated", "gridPreDestroyed"]'></api-documentation>

## State Contents

The following is captured in the grid state:
- [Aggregation Functions](/aggregation/)
- [Opened Column Groups](/column-groups/)
- [Column Order](/column-moving/)
- [Pinned Columns](/column-pinning/)
- [Column Sizes](/column-sizing/)
- [Hidden Columns](/column-properties/#reference-display-hide)
- [Column Filter Model](/filtering/)
- [Advanced Filter Model](/filter-advanced/#filter-model--api)
- [Focused Cell](/keyboard-navigation/) ([Client-Side Row Model](/row-models/) only)
- [Current Page](/row-pagination/)
- [Pivot Mode and Columns](/pivoting/)
- [Range Selection](/range-selection/)
- [Row Group Columns](/grouping/)
- [Expanded Row Groups](/grouping-opening-groups/)
- [Row Selection](/row-selection/)
- [Scroll Position](/scrolling-scenarios/) ([Client-Side Row Model](/row-models/) only)
- [Side Bar](/side-bar/)
- [Sort](/row-sorting/)

Note that all the state properties are optional, so a property can be excluded if you do not want to restore it.

<interface-documentation interfaceName='GridState'></interface-documentation>
