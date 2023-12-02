import {
    Component,
    FilterChangedEvent,
    _,
    IFloatingFilterComp,
    IFloatingFilterParams,
    UserComponentFactory,
    Autowired,
    IFilterDef,
    AgPromise,
    MultiFilterParams,
    IMultiFilterModel,
    IFilter,
    FilterManager,
    UserCompDetails,
} from '@ag-grid-community/core';
import { MultiFilter } from './multiFilter';

export class MultiFloatingFilterComp extends Component implements IFloatingFilterComp<MultiFilter> {
    @Autowired('userComponentFactory') private readonly userComponentFactory: UserComponentFactory;
    @Autowired('filterManager') private readonly filterManager: FilterManager;

    private floatingFilters: IFloatingFilterComp[] = [];
    private compDetailsList: UserCompDetails[] = [];
    private params: IFloatingFilterParams<MultiFilter>;

    constructor() {
        super(/* html */`<div class="ag-multi-floating-filter ag-floating-filter-input"></div>`);
    }

    public init(params: IFloatingFilterParams<MultiFilter>): AgPromise<void> {
        this.params = params;

        const { compDetailsList } = this.getCompDetailsList(params);
        return this.setParams( compDetailsList );
    }

    private setParams(compDetailsList: UserCompDetails[]): AgPromise<void> {
        const floatingFilterPromises: AgPromise<IFloatingFilterComp>[] = [];

        compDetailsList.forEach(compDetails => {
            const floatingFilterPromise = compDetails?.newAgStackInstance();

            if (floatingFilterPromise != null) {
                this.compDetailsList.push(compDetails!);
                floatingFilterPromises.push(floatingFilterPromise);
            }
        });

        return AgPromise.all(floatingFilterPromises).then(floatingFilters => {
            floatingFilters!.forEach((floatingFilter, index) => {
                this.floatingFilters.push(floatingFilter!);

                const gui = floatingFilter!.getGui();

                this.appendChild(gui);

                if (index > 0) {
                    _.setDisplayed(gui, false);
                }
            });
        });
    }

    public onParamsUpdated(params: IFloatingFilterParams<MultiFilter>): void {
        this.params = params;
        const { compDetailsList: newCompDetailsList, floatingFilterParamsList } = this.getCompDetailsList(params);
        const allFloatingFilterCompsUnchanged = newCompDetailsList.length === this.compDetailsList.length
            && newCompDetailsList.every((newCompDetails, index) => !this.filterManager.areFilterCompsDifferent(this.compDetailsList[index], newCompDetails));

        if (allFloatingFilterCompsUnchanged) {
            floatingFilterParamsList.forEach((floatingFilterParams, index) => {
                const floatingFilter = this.floatingFilters[index] as IFloatingFilterComp<IFilter>;
                floatingFilter.onParamsUpdated?.(floatingFilterParams);
            });
        } else {
            _.clearElement(this.getGui());
            this.destroyBeans(this.floatingFilters);
            this.floatingFilters = [];
            this.compDetailsList = [];
            this.setParams(newCompDetailsList);
        }
    }

    private getCompDetailsList(params: IFloatingFilterParams<MultiFilter>): {
        compDetailsList: UserCompDetails[], floatingFilterParamsList: IFloatingFilterParams<IFilter>[]
    } {
        const compDetailsList: UserCompDetails[] = [];
        const floatingFilterParamsList: IFloatingFilterParams<IFilter>[] = [];
        const filterParams = params.filterParams as MultiFilterParams;

        MultiFilter.getFilterDefs(filterParams).forEach((filterDef, index) => {
            const floatingFilterParams: IFloatingFilterParams<IFilter> = {
                ...params,
                // set the parent filter instance for each floating filter to the relevant child filter instance
                parentFilterInstance: (callback) => {   
                    this.parentMultiFilterInstance((parent) => {
                        const child = parent.getChildFilterInstance(index);
                        if (child == null) { return; }

                        callback(child);
                    });
                }
            };
            _.mergeDeep(floatingFilterParams.filterParams, filterDef.filterParams);

            const compDetails = this.getCompDetails(filterDef, floatingFilterParams);
            if (compDetails) {
                compDetailsList.push(compDetails);
                floatingFilterParamsList.push(floatingFilterParams);
            }
        });
        return { compDetailsList, floatingFilterParamsList };
    }

    public onParentModelChanged(model: IMultiFilterModel, event: FilterChangedEvent): void {
        // We don't want to update the floating filter if the floating filter caused the change,
        // because the UI is already in sync. if we didn't do this, the UI would behave strangely
        // as it would be updating as the user is typing
        if (event && event.afterFloatingFilter) { return; }

        this.parentMultiFilterInstance((parent) => {
            if (model == null) {
                this.floatingFilters.forEach((filter, i) => {
                    filter.onParentModelChanged(null, event);
                    _.setDisplayed(filter.getGui(), i === 0);
                });
            } else {
                const lastActiveFloatingFilterIndex = parent.getLastActiveFilterIndex();

                this.floatingFilters.forEach((filter, i) => {
                    const filterModel = model.filterModels!.length > i ? model.filterModels![i] : null;

                    filter.onParentModelChanged(filterModel, event);

                    const shouldShow = lastActiveFloatingFilterIndex == null ? i === 0 : i === lastActiveFloatingFilterIndex;

                    _.setDisplayed(filter.getGui(), shouldShow);
                });
            }
        });
    }

    public destroy(): void {
        this.destroyBeans(this.floatingFilters);
        this.floatingFilters.length = 0;

        super.destroy();
    }

    private getCompDetails(filterDef: IFilterDef, params: IFloatingFilterParams<IFilter>): UserCompDetails | undefined {
        let defaultComponentName = this.userComponentFactory.getDefaultFloatingFilterType(
            filterDef,
            () => this.filterManager.getDefaultFloatingFilter(this.params.column)
        ) ?? 'agReadOnlyFloatingFilter';

        return this.userComponentFactory.getFloatingFilterCompDetails(filterDef, params, defaultComponentName);
    }

    private parentMultiFilterInstance(cb: (instance: MultiFilter) => void): void {
        this.params.parentFilterInstance((parent) => {
            if (!(parent instanceof MultiFilter)) {
                throw new Error('AG Grid - MultiFloatingFilterComp expects MultiFilter as its parent');
            }

            cb(parent);
        });
    }
}
