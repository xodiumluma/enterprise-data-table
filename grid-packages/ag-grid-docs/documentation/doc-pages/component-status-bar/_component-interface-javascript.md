<framework-specific-section frameworks="javascript">
|## Status Bar Panel Interface
|
|Implement this interface to create a status bar component.
</framework-specific-section>

<framework-specific-section frameworks="javascript">
<snippet transform={false} language="ts">
|interface IStatusPanelComp {
|    // The init(params) method is called on the status bar component once.
|    // See below for details on the parameters.
|    init?(params: IStatusPanelParams): void;
|
|    // Return the DOM element of your component, this is what the grid puts into the DOM.
|    getGui(): HTMLElement;
|
|    // Gets called when the grid is destroyed - if your status bar components needs to do any cleanup, do it here.
|    destroy?(): void;
|}
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript">
|The method init(params) takes a params object with the interface `IStatusPanelParams`.
</framework-specific-section>


