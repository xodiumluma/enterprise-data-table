---
title: "Sparklines - Column Customisation"
enterprise: true
---

This section shows how Column Sparklines can be customised by overriding the default column options.

The following [Column Sparkline Options](/sparklines-column-customisation/#columnsparklineoptions) can be used to customise Column Sparklines:

- [Column Fill Options](/sparklines-column-customisation/#column-fill-options)
- [Column Stroke Options](/sparklines-column-customisation/#column-stroke-options)
- [Column Padding Options](/sparklines-column-customisation/#column-padding-options)
- [Column Label Options](/sparklines-column-customisation/#column-label-options)
- [Axis Line Options](/sparklines-column-customisation/#axis-line-options)
- [Sparkline Padding Options](/sparklines-column-customisation/#sparkline-padding-options)

Also see [Additional Customisations](/sparklines-column-customisation/#additional-customisations) for more advanced
customisations that are common across all sparklines.

The snippet below shows option overrides for the Column Sparkline:

```js
sparklineOptions: {
    type: 'column',
    fill: '#91cc75',
    stroke: '#91cc75',
    highlightStyle: {
        fill: 'orange'
    },
    paddingInner: 0.3,
    paddingOuter: 0.1,
},
```

The following example demonstrates the results of the Column Sparkline options above:

<grid-example title='Column Sparkline Customisation' name='column-sparkline-customisation' type='generated' options='{ "enterprise": true, "exampleHeight": 585, "modules": ["clientside", "sparklines"] }'></grid-example>

## Column Fill Options

To apply a custom color to the columns, set the `fill` property in `sparklineOptions` as shown:

```js
sparklineOptions: {
    type: 'column',
    fill: '#91cc75', // sets the column fill
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Column fill default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-fill.png" alt="Column fill customisation" width="250px" constrained="true" filterdarkmode="true">Custom fill</image-caption>
</div>

It is possible to set the fill for the highlighted state of the column by adding `fill` in `highlightStyle` options as follows:

```js
sparklineOptions: {
    type: 'column',
    highlightStyle: {
        fill: 'orange', // sets the highlighted column fill
    }
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default-highlighted.png" alt="Highlighted Column fill default" width="250px" constrained="true" filterdarkmode="true">Default highlighted fill</image-caption>
    <image-caption src="resources/custom-highlighted-fill.png" alt="Highlighted Column fill customisation" width="250px" constrained="true" filterdarkmode="true">Custom highlighted fill</image-caption>
</div>

The given `fill` string can be in one of the following formats:
- `#rgb` - Short Hex Code
- `#rrggbb` - Hex Code
- `rgb(r, g, b)` - RGB
- `rgba(r, g, b, a)` - RGB with an alpha channel
- CSS color keyword - such as `aqua`, `orange`, etc.

## Column Stroke Options

By default, the `strokeWidth` of each column is `0`, so no outline is visible around the columns.

To add a stroke, modify the `strokeWidth` and `stroke` properties as shown below.

```js
sparklineOptions: {
    type: 'column',
    stroke: '#ec7c7d', // sets the column stroke
    strokeWidth: 2, // sets the column stroke width
    highlightStyle: {
        stroke: '#b5ec7c', // sets the highlighted column stroke
        strokeWidth: 2, // sets the highlighted column stroke width
    }
}
```

- In the snippet above, we have configured the column stroke to be `2`px in the un-highlighted state, and `2`px in the highlighted state.
- Note that the `stroke` property is also different depending on the highlighted state of the column.

Here is the result of the configuration shown in the above snippet.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Stroke default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-stroke.png" alt="Stroke customisation" width="250px" constrained="true" filterdarkmode="true">Custom stroke</image-caption>
    <image-caption src="resources/custom-highlighted-stroke.png" alt="Stroke customisation for highlighted state" width="250px" constrained="true" filterdarkmode="true">Custom highlighted stroke</image-caption>
</div>

<note>
If `strokeWidth` is set to a value greater than `1`, it is recommended to set the axis line `strokeWidth` to the same value in order to preserve the alignment of the columns with the axis line.
</note>

## Column Padding Options

The spacing between columns is adjustable via the `paddingInner` property. This property takes values between 0 and 1.

It is a proportion of the “step”, which is the interval between the start of a band and the start of the next band.

Here's an example.

```js
sparklineOptions: {
    type: 'column',
    paddingInner: 0.5, // sets the padding between columns.
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Column padding default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-padding-inner.png" alt="PaddingInner customisation" width="250px" constrained="true" filterdarkmode="true">Custom paddingInner</image-caption>
</div>

The padding on the outer edges of the first and last columns can also be adjusted. As with `paddingInner`, this value can be between 0 and 1.

If the value of `paddingOuter` is increased, the axis line will stick out more at both ends of the sparkline.

Here's a snippet where the `paddingOuter` is set to `0`.

```js
sparklineOptions: {
    type: 'column',
    paddingOuter: 0, // sets the padding on the outer edge of the first and last columns.
}
```

In this case there will be no gap on either end of the sparkline, i.e. between the axis line start and the first column and the axis line end and the last column.
This is demonstrated below in the middle sparkline.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="column padding default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-padding-outer.png" alt="PaddingOuter customisation" width="250px" constrained="true" filterdarkmode="true">No paddingOuter</image-caption>
    <image-caption src="resources/custom-padding-outer-2.png" alt="PaddingOuter customisation" width="250px" constrained="true" filterdarkmode="true">Increased paddingOuter</image-caption>
</div>

## Column Label Options

To enable column labels, set the `enabled` property in `label` options as shown:

```js
sparklineOptions: {
    type: 'column',
    label: {
        enabled: true // show column labels
    }
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Column default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/default-label.png" alt="Column labels enabled" width="250px" constrained="true" filterdarkmode="true">Label enabled</image-caption>
</div>

<grid-example title='Column Sparkline Labels' name='column-sparkline-labels' type='generated' options='{ "enterprise": true, "exampleHeight": 585, "modules": ["clientside", "sparklines"] }'></grid-example>

It is possible to change the text value displayed as the label of individual columns by adding a `formatter` callback function to `label` options as follows:

```js
sparklineOptions: {
    type: 'column',
    label: {
        enabled: true,
        formatter: labelFormatter
    }
}

function labelFormatter({ value }) {
    return `${value}%`
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Column default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-label-formatter.png" alt="Column label text customisation" width="250px" constrained="true" filterdarkmode="true">Custom label text</image-caption>
</div>

To customise the label text style, set the style attributes in `label` options as follows:

```js
sparklineOptions: {
    type: 'column',
    label: {
        enabled: true,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontSize: 9,
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: 'black',
    }
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Column default" width="250px" constrained="true" filterdarkmode="true">Default</image-caption>
    <image-caption src="resources/custom-label-styles.png" alt="Column label text style customisation" width="250px" constrained="true" filterdarkmode="true">Custom label text styles</image-caption>
</div>

The position of the labels can be specified by setting the `placement` property in `label` options. By default, the labels are positioned at the end of the columns on the inside, i.e. `placement` is set to `insideEnd `. The snippet below shows how the positioning of the label can be modified:

```js
sparklineOptions: {
    type: 'column',
    label: {
        enabled: true,
        placement: 'center', // positions the labels in the center of the columns
    }
}
```

Label `placement` options include `insideBase`, `center`, `insideEnd` and `outsideEnd`. These are shown in the screenshots below.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/custom-label-placement-insideBase.png" alt="Column label insideBase placement" width="250px" constrained="true" filterdarkmode="true">insideBase</image-caption>
    <image-caption src="resources/custom-label-placement-center.png" alt="Column label center placement" width="250px" constrained="true" filterdarkmode="true">center</image-caption>
</div>
<div style="display: flex; justify-content: center;">
    <image-caption src="resources/custom-label-placement-insideEnd.png" alt="Column label insideEnd placement" width="250px" constrained="true" filterdarkmode="true">insideEnd</image-caption>
    <image-caption src="resources/custom-label-placement-outsideEnd.png" alt="Column label placement default" width="250px" constrained="true" filterdarkmode="true">outsideEnd</image-caption>
</div>

<note>
When configuring labels with placement:`outsideEnd`, it is recommended to add some padding to the sparkline using the `padding` options in order to prevent the labels from being clipped.
</note>

## Axis Line Options

By default, an axis line is displayed which can be modified using the `axis` options.

Here is a snippet to demonstrate axis formatting.

```js
sparklineOptions: {
    type: 'column',
    axis: {
        stroke: '#7cecb3', // sets the axis line stroke
        strokeWidth: 3, // sets the axis line strokeWidth
    },
}
```

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Axis line default" width="250px" constrained="true" filterdarkmode="true">Default axis line</image-caption>
    <image-caption src="resources/custom-axis.png" alt="Axis line customisation" width="250px" constrained="true" filterdarkmode="true">Custom axis line</image-caption>
</div>

<note>
It's possible to remove the axis line entirely by setting the axis `strokeWidth` to `0`.
</note>

## Sparkline Padding Options

To add extra space around the sparklines, custom `padding` options can be applied in the following way.

```js
sparklineOptions: {
    type: 'column',
    // sets the padding around the sparklines
    padding: {
        top: 10,
        right: 5,
        bottom: 10,
        left: 5
    },
}
```

- The `top`, `right`, `bottom` and `left` properties are all optional and can be modified independently.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default-padding.png" alt="Padding customisation" width="250px" constrained="true" filterdarkmode="true">Default padding</image-caption>
    <image-caption src="resources/custom-padding.png" alt="Padding customisation" width="250px" constrained="true" filterdarkmode="true">Custom padding</image-caption>
</div>

## Additional Customisations

More advanced customisations are discussed separately in the following sections:

- [Axis](/sparklines-axis-types/) - configure the axis type via `axis` options.
- [Tooltips](/sparklines-tooltips/) - configure tooltips using `tooltip` options.
- [Points of Interest](/sparklines-points-of-interest/) - configure individual points of interest using a `formatter`.

## Interfaces

### ColumnSparklineOptions

<interface-documentation interfaceName='ColumnSparklineOptions' overrideSrc='sparklines-column-customisation/resources/column-sparkline-api.json'></interface-documentation>

### SparklineAxisOptions
<interface-documentation interfaceName='SparklineAxisOptions' ></interface-documentation>

### SparklineLabelOptions
<interface-documentation interfaceName='SparklineLabelOptions' ></interface-documentation>


## Next Up

Continue to the next section to learn about: [Line Sparkline Customisation](/sparklines-line-customisation/).
