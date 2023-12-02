<framework-specific-section frameworks="react">
<snippet transform={false} language="jsx">
|const KEY_LEFT = 'ArrowLeft';
|const KEY_UP = 'ArrowUp';
|const KEY_RIGHT = 'ArrowRight';
|const KEY_DOWN = 'ArrowDown';
|const KEY_PAGE_UP = 'PageUp';
|const KEY_PAGE_DOWN = 'PageDown';
|const KEY_PAGE_HOME = 'Home';
|const KEY_PAGE_END = 'End';
|
|const MyCellEditor = forwardRef((props, ref) => {
|    const [value, setValue] = useState(props.value);
|
|    /* Component Editor Lifecycle methods */
|    useImperativeHandle(ref, () => {
|        return {
|            getValue() {
|                return value;
|            }
|        };
|    });
|
|    onKeyDown(event) {
|       const key = event.key;
|
|        const isNavigationKey = key === KEY_LEFT ||
|           key === KEY_RIGHT ||
|           key === KEY_UP ||
|           key === KEY_DOWN ||
|           key === KEY_PAGE_DOWN ||
|           key === KEY_PAGE_UP ||
|           key === KEY_PAGE_HOME ||
|           key === KEY_PAGE_END;
|
|           if (isNavigationKey) {
|               // this stops the grid from receiving the event and executing keyboard navigation
|               event.stopPropagation();
|           }
|    }
|
|    return (
|        &lt;input value={value}
|               onKeyDown={event => onKeyDown(event)}
|        />
|    );
|});
</snippet>
</framework-specific-section>