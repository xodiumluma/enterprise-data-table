<framework-specific-section frameworks="react">
|## Custom Date Interface
|
|The interface for a custom date component is as follows:
</framework-specific-section>

<framework-specific-section frameworks="react">
<interface-documentation interfaceName='IDateReactComp' config='{"asCode":true }' ></interface-documentation>
</framework-specific-section>

<framework-specific-section frameworks="react">
<note>
|Note that if you're using Hooks for Grid Components that have lifecycle/callbacks that the
|grid will call (for example, the `getDate` callback from an Date Component), then you'll need to expose them with
|`forwardRef` & `useImperativeHandle`.
|
|Please refer to the [Hook](/react-hooks/) documentation (or the examples on this page) for more information.
</note>
</framework-specific-section>

<framework-specific-section frameworks="react">
|### Custom Date Parameters
|
|When a React component is instantiated the grid will make the grid APIs, a number of utility methods as well as the cell &
|row values available to you via `props` - the interface for what is provided is documented below.
</framework-specific-section>