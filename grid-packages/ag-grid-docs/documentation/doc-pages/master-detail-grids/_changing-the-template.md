
<framework-specific-section frameworks="javascript,angular,vue">
|## Changing the Template
|
|By default the Detail Cell Renderer does not include any other information around the Detail Grid. It is possible to change this to allow additional details, such as header information, around the Detail Grid. This is done by providing an alternative Detail Template.
|
|If providing an alternative template, you **must** include an element with `ref="eDetailGrid"`. This tells the grid where to place the Detail Grid.
|
|For comparison, the default template is as follows. It is simplistic, only intended for allowing spacing around the Detail Grid.
|
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
<snippet transform={false} language="html">
|&lt;!-- for when fixed height (normal) -->
|&lt;div class="ag-details-row ag-details-row-fixed-height">
|    &lt;div ref="eDetailGrid" class="ag-details-grid ag-details-grid-fixed-height"/>
|&lt;/div>
|
|&lt;!-- for when auto-height (detailRowAutoHeight=true) -->
|&lt;div class="ag-details-row ag-details-row-auto-height">
|    &lt;div ref="eDetailGrid" class="ag-details-grid ag-details-grid-auto-height"/>
|&lt;/div>
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
|To change the Detail Template, set the `template` inside the Detail Cell Renderer Params. The Detail Template can be a String or Function depending on whether you want to provide the template statically or dynamically:
|
|- **String Template** - Statically overrides the template used by the grid. The same fixed template is used for each row. This is useful for styling or generic information.
|
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
<snippet transform={false}>
|    // example override using string template
|    detailCellRendererParams: {
|        template:
|        '&lt;div style="background-color: #edf6ff;">' +
|            '  &lt;div style="height: 10%;">Call Details&lt;/div>' +
|            '  &lt;div ref="eDetailGrid" style="height: 90%;">&lt;/div>' +
|            '&lt;/div>'
|    }
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
|- **Function Template** - Called each time a detail row is shown to dynamically provide a template based on the data. Useful for displaying information specific to the Detail Grid dataset
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
<snippet transform={false}>
|    // override using template callback
|    detailCellRendererParams: {
|        template: params => {
|            const personName = params.data.name;
|            return '&lt;div style="height: 100%; background-color: #EDF6FF;">' +
|            '  &lt;div style="height: 10%;">Name: ' + personName + '&lt;/div>' +
|            '  &lt;div ref="eDetailGrid" style="height: 90%;">&lt;/div>' +
|            '&lt;/div>';
|        }
|    }
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
|The following two examples demonstrate both approaches.
|
|### Example Static Template
|
|In this first example, the template is set statically. Note the following:
|
|- All Detail Grids have a spacing with blue background.
|- All Detail Grids have the same static title 'Call Details'.
|
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
<grid-example title='Customising via String Template' name='string-template-customisation' type='generated' options='{ "enterprise": true, "exampleHeight": 550, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
|### Example Dynamic Template
|
|In this second example, the template is set dynamically. Note the following:
|
|- All Detail Grids have a spacing with blue background.
|- All Detail Grids have a different dynamic title including the persons name e.g. 'Mila Smith'.
|
</framework-specific-section>

<framework-specific-section frameworks="javascript,angular,vue">
<grid-example title='Customising via Template Callback' name='template-callback-customisation' type='generated' options='{ "enterprise": true, "exampleHeight": 550, "modules": ["clientside", "masterdetail", "menu", "columnpanel"] }'></grid-example>
</framework-specific-section>