import {
    ColumnApi,
    GridApi,
    GridOptions,
    ICellEditor,
    ICellRenderer,
    IDate,
    IFilter,
    IFloatingFilter,
    IHeader,
    IHeaderGroup,
    IStatusPanel,
    IToolPanel,
    Module
} from 'ag-grid-community';

/** @deprecated v29 ChangeDetectionStrategyType has been deprecated. IdentityCheck will always be used now for a more consistent approach. */
export enum ChangeDetectionStrategyType {
    IdentityCheck = 'IdentityCheck',
    DeepValueCheck = 'DeepValueCheck',
    NoCheck = 'NoCheck'
}

export interface SharedProps<TData = any> extends GridOptions<TData> {
    gridOptions?: GridOptions<TData>;
    /**
     * Used to register AG Grid Modules directly with this instance of the grid. 
     * See [Providing Modules To Individual Grids](https://www.ag-grid.com/react-data-grid/modules/#providing-modules-to-individual-grids) for more information. 
     */
    modules?: Module[];
    containerStyle?: any;
    className?: string;
    setGridApi?: (gridApi: GridApi<TData>, columnApi: ColumnApi) => void;
    componentWrappingElement?: string; // only used when putting React into JS
    maxComponentCreationTimeMs?: number; // only used when putting React into JS
    children?: any;
}

export interface AgReactUiProps<TData = any> extends SharedProps<TData> {
}

export interface AgGridReactProps<TData = any> extends SharedProps<TData> {
    disableStaticMarkup?: boolean;  // only used when legacyComponentRendering is true
    legacyComponentRendering?: boolean,
}

export interface AgReactComponent {
    getReactContainerStyle?: () => {};
    getReactContainerClasses?: () => string[];
}

export interface IHeaderGroupReactComp extends IHeaderGroup, AgReactComponent {
}

export interface IHeaderReactComp extends IHeader, AgReactComponent {
}

export interface IDateReactComp extends IDate, AgReactComponent {
}

export interface IFilterReactComp extends IFilter, AgReactComponent {
}

export interface IFloatingFilterReactComp extends IFloatingFilter, AgReactComponent {
}
export interface ICellRendererReactComp extends ICellRenderer, AgReactComponent {
}

export interface ICellEditorReactComp extends ICellEditor, AgReactComponent {
}

export interface ILoadingCellRendererReactComp extends AgReactComponent {
}

export interface ILoadingOverlayReactComp extends AgReactComponent {
}

export interface INoRowsOverlayReactComp extends AgReactComponent {
}

export interface IStatusPanelReactComp extends IStatusPanel, AgReactComponent {
}

export interface IToolPanelReactComp extends IToolPanel, AgReactComponent {
}

export interface ITooltipReactComp extends AgReactComponent {
}
