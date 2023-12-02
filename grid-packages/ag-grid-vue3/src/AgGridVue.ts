import { defineComponent, getCurrentInstance, h, PropType } from 'vue';
import { markRaw, toRaw } from '@vue/reactivity';
import { ComponentUtil, createGrid, Events, GridApi, GridOptions, IRowNode, Module } from 'ag-grid-community';

import { getAgGridProperties, Properties } from './Utils';
import { VueFrameworkComponentWrapper } from './VueFrameworkComponentWrapper';
import { VueFrameworkOverrides } from './VueFrameworkOverrides';

const ROW_DATA_EVENTS: Set<string> = new Set(['rowDataUpdated', 'cellValueChanged', 'rowValueChanged']);
const ALWAYS_SYNC_GLOBAL_EVENTS: Set<string> = new Set([Events.EVENT_GRID_PRE_DESTROYED]);
const DATA_MODEL_ATTR_NAME = 'onUpdate:modelValue'; // emit name would be update:ModelValue
const DATA_MODEL_EMIT_NAME = 'update:modelValue';

const [props, computed, watch] = getAgGridProperties();

export const AgGridVue = defineComponent({
    render() {
        return h('div')
    },
    props: {
        gridOptions: {
            type: Object as PropType<GridOptions>,
            default: () => ({} as GridOptions),
        },
        autoParamsRefresh: {
            type: Boolean,
            default: () => false,
        },
        componentDependencies: {
            type: Array as PropType<String[]>,
            default: () => [],
        },
        plugins: [],
        modules: {
            type: Array as PropType<Module[]>,
            default: () => [],
        },
        modelValue: {
            type: Array,
            default: undefined,
            required: false
        },
        ...props
    },
    data() : {
        api: GridApi | undefined,
        gridCreated: boolean,
        isDestroyed: boolean,
        gridReadyFired: boolean,
        emitRowModel?: (() => void | null),
    } {
        return {
            api: undefined,
            gridCreated: false,
            isDestroyed: false,
            gridReadyFired: false,
            emitRowModel: undefined
        }
    },
    computed,
    watch,
    methods: {
        globalEventListenerFactory(restrictToSyncOnly?: boolean) {
            return (eventType: string, event: any) => {
                if (this.isDestroyed) {
                    return;
                }

                if (eventType === 'gridReady') {
                    this.gridReadyFired = true;
                }

                const alwaysSync = ALWAYS_SYNC_GLOBAL_EVENTS.has(eventType);
                if ((alwaysSync && !restrictToSyncOnly) || (!alwaysSync && restrictToSyncOnly)) {
                    return;
                }

                this.updateModelIfUsed(eventType);
            }
        },
        processChanges(propertyName: string, currentValue: any, previousValue: any) {
            if (this.gridCreated) {
                if (this.skipChange(propertyName, currentValue, previousValue)) {
                    return;
                }

                const options: Properties = {
                    [propertyName]: propertyName === 'rowData' ? (
                            Object.isFrozen(currentValue) ? currentValue : markRaw(toRaw(currentValue))
                        ) : currentValue,
                };
                // decouple the row data - if we don't when the grid changes row data directly that'll trigger this component to react to rowData changes,
                // which can reset grid state (ie row selection)
                ComponentUtil.processOnChange(options, this.api as any);
            }
        },
        checkForBindingConflicts() {
            const thisAsAny = (this as any);
            if ((thisAsAny.rowData || this.gridOptions.rowData) &&
                thisAsAny.modelValue) {
                console.warn('AG Grid: Using both rowData and v-model. rowData will be ignored.');
            }
        },
        getRowData(): any[] {
            const rowData: any[] = [];
            this.api?.forEachNode((rowNode: IRowNode) => {
                rowData.push(rowNode.data);
            });
            return rowData;
        },
        updateModelIfUsed(eventType: string) {
            if (this.gridReadyFired &&
                this.$attrs[DATA_MODEL_ATTR_NAME] &&
                ROW_DATA_EVENTS.has(eventType)) {

                if (this.emitRowModel) {
                    this.emitRowModel();
                }
            }
        },
        getRowDataBasedOnBindings() {
            const thisAsAny = (this as any);

            const rowData = thisAsAny.modelValue
            return rowData ? rowData :
                thisAsAny.rowData ? thisAsAny.rowData : thisAsAny.gridOptions.rowData;
        },
        getProvides() {
            let instance = getCurrentInstance() as any;
            let provides = {};

            while (instance) {
                if (instance && instance.provides) {
                    provides = {...provides, ...instance.provides}
                }

                instance = instance.parent;
            }

            return provides;
        },
        /*
        * Prevents an infinite loop when using v-model for the rowData
        */
        skipChange(propertyName: string, currentValue: any, previousValue: any) {
            if (this.gridReadyFired &&
                propertyName === 'rowData' &&
                this.$attrs[DATA_MODEL_ATTR_NAME]) {
                if (currentValue === previousValue) {
                    return true;
                }

                if (currentValue && previousValue) {
                    const currentRowData = currentValue as any[];
                    const previousRowData = previousValue as any[];
                    if (currentRowData.length === previousRowData.length) {
                        for (let i = 0; i < currentRowData.length; i++) {
                            if (currentRowData[i] !== previousRowData[i]) {
                                return false;
                            }
                        }
                        return true;
                    }
                }
            }

            return false;
        },
        debounce(func: () => void, delay: number) {
            let timeout: number;
            return () => {
                const later = function () {
                    func();
                };
                window.clearTimeout(timeout);
                timeout = window.setTimeout(later, delay);
            };
        }
    },
    mounted() {
        // we debounce the model update to prevent a flood of updates in the event there are many individual
        // cell/row updates
        this.emitRowModel = this.debounce(() => {
            this.$emit(DATA_MODEL_EMIT_NAME, Object.freeze(this.getRowData()));
        }, 20);


        const provides = this.getProvides();
        const frameworkComponentWrapper = new VueFrameworkComponentWrapper(this, provides);

        // the gridOptions we pass to the grid don't need to be reactive (and shouldn't be - it'll cause issues
        // with mergeDeep for example
        const gridOptions = markRaw(ComponentUtil.combineAttributesAndGridOptions(toRaw(this.gridOptions), this));

        this.checkForBindingConflicts();

        const rowData = this.getRowDataBasedOnBindings();
        if (rowData !== ComponentUtil.VUE_OMITTED_PROPERTY) {
            gridOptions.rowData = rowData ? (Object.isFrozen(rowData) ? rowData : markRaw(toRaw(rowData))) : rowData;
        }

        const gridParams = {
            globalEventListener: this.globalEventListenerFactory().bind(this),
            globalSyncEventListener: this.globalEventListenerFactory(true).bind(this),
            frameworkOverrides: new VueFrameworkOverrides(this),
            providedBeanInstances: {
                frameworkComponentWrapper,
            },
            modules: this.modules,
        };

        this.api = createGrid(this.$el as HTMLElement, gridOptions, gridParams);
        this.gridCreated = true;
    },
    unmounted() {
        if (this.gridCreated) {
            this.api?.destroy();
            this.isDestroyed = true;
        }
    }
});
