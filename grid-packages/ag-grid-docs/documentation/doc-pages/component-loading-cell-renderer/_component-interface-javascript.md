<framework-specific-section frameworks="javascript">
|## Loading Cell Renderer Component
|
|The interface for the loading cell renderer component is as follows:
</framework-specific-section>

<framework-specific-section frameworks="javascript">
<snippet transform={false} language="ts">
|interface ILoadingCellRendererComp {
|    // The init(params) method is called on the loading cell renderer once. See below for details on the parameters.
|    init(params: ILoadingCellRendererParams): void;
|
|    // Returns the DOM element for this loading cell renderer
|    getGui(): HTMLElement;
|}
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript">
|The interface for the loading cell renderer parameters is as follows:
</framework-specific-section>


