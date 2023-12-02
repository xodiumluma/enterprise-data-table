import {
    ColDef,
    ColGroupDef,
    Component,
    FiltersToolPanelState,
    IFiltersToolPanel,
    IToolPanelComp,
    IToolPanelParams,
    RefSelector
} from "@ag-grid-community/core";
import { FiltersToolPanelHeaderPanel } from "./filtersToolPanelHeaderPanel";
import { FiltersToolPanelListPanel } from "./filtersToolPanelListPanel";

export interface ToolPanelFiltersCompParams extends IToolPanelParams {
    /** To suppress Expand / Collapse All */
    suppressExpandAll: boolean;
    /** To suppress the Filter Search */
    suppressFilterSearch: boolean;
    /** Suppress updating the layout of columns as they are rearranged in the grid */
    suppressSyncLayoutWithGrid: boolean;
}

export class FiltersToolPanel extends Component implements IFiltersToolPanel, IToolPanelComp {

    private static TEMPLATE = /* html */
        `<div class="ag-filter-toolpanel">
            <ag-filters-tool-panel-header ref="filtersToolPanelHeaderPanel"></ag-filters-tool-panel-header>
            <ag-filters-tool-panel-list ref="filtersToolPanelListPanel"></ag-filters-tool-panel-list>
         </div>`;

    @RefSelector('filtersToolPanelHeaderPanel') private filtersToolPanelHeaderPanel: FiltersToolPanelHeaderPanel;

    @RefSelector('filtersToolPanelListPanel') private filtersToolPanelListPanel: FiltersToolPanelListPanel;

    private initialised = false;
    private params: ToolPanelFiltersCompParams;
    private listenerDestroyFuncs: (() => void)[] = [];

    constructor() {
        super(FiltersToolPanel.TEMPLATE);
    }

    public init(params: ToolPanelFiltersCompParams): void {
        // if initialised is true, means this is a refresh
        if (this.initialised) {
            this.listenerDestroyFuncs.forEach(func => func());
            this.listenerDestroyFuncs = [];
        }

        this.initialised = true;

        const defaultParams: Partial<ToolPanelFiltersCompParams> = {
            suppressExpandAll: false,
            suppressFilterSearch: false,
            suppressSyncLayoutWithGrid: false,
            api: this.gridOptionsService.api,
            columnApi: this.gridOptionsService.columnApi,
        };
        this.params = {
            ...defaultParams,
            ...params,
            context: this.gridOptionsService.context
        };

        this.filtersToolPanelHeaderPanel.init(this.params);
        this.filtersToolPanelListPanel.init(this.params);

        const hideExpand = this.params.suppressExpandAll;
        const hideSearch = this.params.suppressFilterSearch;

        if (hideExpand && hideSearch) {
            this.filtersToolPanelHeaderPanel.setDisplayed(false);
        }

        // this is necessary to prevent a memory leak while refreshing the tool panel
        this.listenerDestroyFuncs.push(
            this.addManagedListener(this.filtersToolPanelHeaderPanel, 'expandAll', this.onExpandAll.bind(this))!,
            this.addManagedListener(this.filtersToolPanelHeaderPanel, 'collapseAll', this.onCollapseAll.bind(this))!,
            this.addManagedListener(this.filtersToolPanelHeaderPanel, 'searchChanged', this.onSearchChanged.bind(this))!,
            this.addManagedListener(this.filtersToolPanelListPanel, 'filterExpanded', this.onFilterExpanded.bind(this))!,
            this.addManagedListener(this.filtersToolPanelListPanel, 'groupExpanded', this.onGroupExpanded.bind(this))!
        );
    }

    // lazy initialise the panel
    public setVisible(visible: boolean): void {
        super.setDisplayed(visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    }

    public onExpandAll(): void {
        this.filtersToolPanelListPanel.expandFilterGroups(true);
    }

    public onCollapseAll(): void {
        this.filtersToolPanelListPanel.expandFilterGroups(false);
    }

    private onSearchChanged(event: any): void {
        this.filtersToolPanelListPanel.performFilterSearch(event.searchText);
    }

    public setFilterLayout(colDefs: (ColDef | ColGroupDef)[]): void {
        this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
    }

    private onFilterExpanded(): void {
        this.params.onStateUpdated();
    }

    private onGroupExpanded(event: any): void {
        this.filtersToolPanelHeaderPanel.setExpandState(event.state);
        this.params.onStateUpdated();
    }

    public expandFilterGroups(groupIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilterGroups(true, groupIds);
    }

    public collapseFilterGroups(groupIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilterGroups(false, groupIds);
    }

    public expandFilters(colIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilters(true, colIds);
    }

    public collapseFilters(colIds?: string[]): void {
        this.filtersToolPanelListPanel.expandFilters(false, colIds);
    }

    public syncLayoutWithGrid(): void {
        this.filtersToolPanelListPanel.syncFilterLayout();
    }

    public refresh(): void {
        this.init(this.params);
    }

    public getState(): FiltersToolPanelState {
        return this.filtersToolPanelListPanel.getExpandedFiltersAndGroups();
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public destroy(): void {
        super.destroy();
    }
}
