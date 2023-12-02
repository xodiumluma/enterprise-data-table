import { IDoesFilterPassParams, IFilterOptionDef, IFilterParams, ProvidedFilterModel } from '../../interfaces/iFilter';
import { OptionsFactory } from './optionsFactory';
import { IProvidedFilter, IProvidedFilterParams, ProvidedFilter } from './providedFilter';
import { AgPromise } from '../../utils';
import { AgSelect } from '../../widgets/agSelect';
import { AgRadioButton } from '../../widgets/agRadioButton';
import { areEqual } from '../../utils/array';
import { setDisplayed, setDisabled, removeFromParent } from '../../utils/dom';
import { FILTER_LOCALE_TEXT } from '../filterLocaleText';
import { AgInputTextField } from '../../widgets/agInputTextField';
import { Component } from '../../widgets/component';
import { AgAbstractInputField } from '../../widgets/agAbstractInputField';
import { IAfterGuiAttachedParams } from '../../interfaces/iAfterGuiAttachedParams';
import { ListOption } from '../../widgets/agList';
import { IFloatingFilterParent } from '../floating/floatingFilter';
import { warnOnce, isFunction } from '../../utils/function';
import { LocaleService } from '../../localeService';

export type JoinOperator = 'AND' | 'OR';

/** Interface contract for the public aspects of the SimpleFilter implementation(s). */
export interface ISimpleFilter extends IProvidedFilter, IFloatingFilterParent {
}

export interface IFilterPlaceholderFunctionParams {
    /**
     * The filter option key
     */
    filterOptionKey: ISimpleFilterModelType,
    /**
     * The filter option name as localised text
     */
    filterOption: string,
    /**
     * The default placeholder text
     */
    placeholder: string
}
export type FilterPlaceholderFunction = (params: IFilterPlaceholderFunctionParams) => string;

/**
 * Parameters provided by the grid to the `init` method of a `SimpleFilter`.
 * Do not use in `colDef.filterParams` - see `ISimpleFilterParams` instead.
 */
export type SimpleFilterParams<TData = any> = ISimpleFilterParams & IFilterParams<TData>;

/**
 * Common parameters in `colDef.filterParams` used by all simple filters. Extended by the specific filter types.
 */
export interface ISimpleFilterParams extends IProvidedFilterParams {
    /**
     * Array of filter options to present to the user.
     */
    filterOptions?: (IFilterOptionDef | ISimpleFilterModelType)[];
    /** The default filter option to be selected. */
    defaultOption?: string;
    /**
     * By default, the two conditions are combined using `AND`.
     * You can change this default by setting this property.
     * Options: `AND`, `OR`
     */
    defaultJoinOperator?: JoinOperator;
    /**
     * Maximum number of conditions allowed in the filter.
     *
     * @default 2
     */
    maxNumConditions?: number;
    /**
     * By default only one condition is shown, and additional conditions are made visible when the previous conditions are entered
     * (up to `maxNumConditions`). To have more conditions shown by default, set this to the number required.
     * Conditions will be disabled until the previous conditions have been entered.
     * Note that this cannot be greater than `maxNumConditions` - anything larger will be ignored.
     *
     * @default 1
     */
    numAlwaysVisibleConditions?: number;
    /**
     * @deprecated As of v29.2 there can be more than two conditions in the filter. Use `maxNumConditions = 1` instead.
     */
    suppressAndOrCondition?: boolean;
    /**
     * @deprecated As of v29.2 there can be more than two conditions in the filter. Use `numAlwaysVisibleConditions = 2` instead.
     */
    alwaysShowBothConditions?: boolean;

    /**
     * Placeholder text for the filter textbox
     */
    filterPlaceholder?: FilterPlaceholderFunction | string;
}

export type ISimpleFilterModelType =
    'empty'
    | 'equals'
    | 'notEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'inRange'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'blank'
    | 'notBlank';
export interface ISimpleFilterModel extends ProvidedFilterModel {
    /** One of the filter options, e.g. `'equals'` */
    type?: ISimpleFilterModelType | null;
}

/**
 * Old combined models prior to v29.2 only supported two conditions, which were defined using `condition1` and `condition2`.
 * New combined models allow more than two conditions using `conditions`.
 * When supplying combined models to the grid:
 * - `conditions` will be used if present.
 * - If `conditions` is not present, `condition1` and `condition2` will be used (deprecated).
 * 
 * When receiving combined models from the grid:
 * - `conditions` will be populated with all the conditions (including the first and second conditions).
 * - `condition1` and `condition2` will be populated with the first and second conditions (deprecated).
 */
export interface ICombinedSimpleModel<M extends ISimpleFilterModel> extends ProvidedFilterModel {
    operator: JoinOperator;
    /** @deprecated As of v29.2, supply as the first element of `conditions`. */
    condition1: M;
    /** @deprecated As of v29.2, supply as the second element of `conditions`. */
    condition2: M;
    /** Will be mandatory in a future release. */
    conditions?: M[];
}

export type Tuple<T> = (T | null)[];

export abstract class SimpleFilterModelFormatter<TValue = any> {
    constructor(
        private readonly localeService: LocaleService,
        private optionsFactory: OptionsFactory,
        protected readonly valueFormatter?: (value: TValue | null) => string | null
    ) {}

    // used by:
    // 1) NumberFloatingFilter & TextFloatingFilter: Always, for both when editable and read only.
    // 2) DateFloatingFilter: Only when read only (as we show text rather than a date picker when read only)
    public getModelAsString(model: ISimpleFilterModel | null): string | null {
        if (!model) {
            return null;
        }
        const isCombined = (model as any).operator != null;
        const translate = this.localeService.getLocaleTextFunc();
        if (isCombined) {
            const combinedModel = model as ICombinedSimpleModel<ISimpleFilterModel>;
            let { conditions } = combinedModel;
            if (!conditions) {
                const { condition1, condition2 } = combinedModel;
                conditions = [condition1, condition2];
            }
            const customOptions = conditions.map(condition => this.getModelAsString(condition));
            const joinOperatorTranslateKey = combinedModel.operator === 'AND' ? 'andCondition' : 'orCondition';
            return customOptions.join(` ${translate(joinOperatorTranslateKey, FILTER_LOCALE_TEXT[joinOperatorTranslateKey])} `);
        } else if (model.type === SimpleFilter.BLANK || model.type === SimpleFilter.NOT_BLANK) {
            return translate(model.type, model.type);
        } else {
            const condition = model as ISimpleFilterModel;
            const customOption = this.optionsFactory.getCustomOption(condition.type);

            // For custom filter options we display the Name of the filter instead
            // of displaying the `from` value, as it wouldn't be relevant
            const { displayKey, displayName, numberOfInputs } = customOption || {};
            if (displayKey && displayName && numberOfInputs === 0) {
                translate(displayKey, displayName);
                return displayName;
            }
            return this.conditionToString(condition, customOption);
        }
    }

    // creates text equivalent of FilterModel. if it's a combined model, this takes just one condition.
    protected abstract conditionToString(condition: ProvidedFilterModel, opts?: IFilterOptionDef): string;

    public updateParams(params: { optionsFactory: OptionsFactory }) {
        this.optionsFactory = params.optionsFactory;
    }

    protected formatValue(value?: TValue | null): string {
        return this.valueFormatter ? (this.valueFormatter(value ?? null) ?? '') : String(value);
    }
}

/**
 * Every filter with a dropdown where the user can specify a comparing type against the filter values.
 *
 * @param M type of filter-model managed by the concrete sub-class that extends this type
 * @param V type of value managed by the concrete sub-class that extends this type
 * @param E type of UI element used for collecting user-input
 */
export abstract class SimpleFilter<M extends ISimpleFilterModel, V, E = AgInputTextField> extends ProvidedFilter<M | ICombinedSimpleModel<M>, V> implements ISimpleFilter {

    public static EMPTY: ISimpleFilterModelType = 'empty';
    public static BLANK: ISimpleFilterModelType = 'blank';
    public static NOT_BLANK: ISimpleFilterModelType = 'notBlank';
    public static EQUALS: ISimpleFilterModelType = 'equals';
    public static NOT_EQUAL: ISimpleFilterModelType = 'notEqual';
    public static LESS_THAN: ISimpleFilterModelType = 'lessThan';
    public static LESS_THAN_OR_EQUAL: ISimpleFilterModelType = 'lessThanOrEqual';
    public static GREATER_THAN: ISimpleFilterModelType = 'greaterThan';
    public static GREATER_THAN_OR_EQUAL: ISimpleFilterModelType = 'greaterThanOrEqual';
    public static IN_RANGE: ISimpleFilterModelType = 'inRange';
    public static CONTAINS: ISimpleFilterModelType = 'contains';
    public static NOT_CONTAINS: ISimpleFilterModelType = 'notContains';
    public static STARTS_WITH: ISimpleFilterModelType = 'startsWith';
    public static ENDS_WITH: ISimpleFilterModelType = 'endsWith';

    protected readonly eTypes: AgSelect[] = [];
    protected readonly eJoinOperatorPanels: HTMLElement[] = [];
    protected readonly eJoinOperatorsAnd: AgRadioButton[] = [];
    protected readonly eJoinOperatorsOr: AgRadioButton[] = [];
    protected readonly eConditionBodies: HTMLElement[] = [];
    private readonly listener = () => this.onUiChanged();

    private maxNumConditions: number;
    private numAlwaysVisibleConditions: number;
    private defaultJoinOperator: JoinOperator;
    private filterPlaceholder: SimpleFilterParams['filterPlaceholder'];
    private lastUiCompletePosition: number | null = null;
    private joinOperatorId = 0;
    private filterListOptions: ListOption[];

    protected optionsFactory: OptionsFactory;
    protected abstract getDefaultFilterOptions(): string[];

    protected abstract createValueElement(): HTMLElement;

    protected abstract removeValueElements(startPosition: number, deleteCount?: number): void;

    // filter uses this to know if new model is different from previous model, ie if filter has changed
    protected abstract areSimpleModelsEqual(a: ISimpleFilterModel, b: ISimpleFilterModel): boolean;

    // getModel() calls this to create the two conditions. if only one condition,
    // the result is returned by getModel(), otherwise is called twice and both results
    // returned in a CombinedFilter object.
    protected abstract createCondition(position: number): M;

    // because the sub-class filter models have different attribute names, we have to map
    protected abstract mapValuesFromModel(filterModel: ISimpleFilterModel | null): Tuple<V>;

    // allow value-type specific handling of null cell values.
    protected abstract evaluateNullValue(filterType?: ISimpleFilterModelType | null): boolean;

    // allow value-type specific handling of non-null cell values.
    protected abstract evaluateNonNullValue(range: Tuple<V>, cellValue: V, filterModel: M, params: IDoesFilterPassParams): boolean;

    // allow iteration of all condition inputs managed by sub-classes.
    protected abstract getInputs(position: number): Tuple<E>;

    // allow retrieval of all condition input values.
    protected abstract getValues(position: number): Tuple<V>;

    protected getNumberOfInputs(type?: ISimpleFilterModelType | null): number {
        const customOpts = this.optionsFactory.getCustomOption(type);
        if (customOpts) {
            const { numberOfInputs } = customOpts;
            return numberOfInputs != null ? numberOfInputs : 1;
        }

        const zeroInputTypes = [
            SimpleFilter.EMPTY, SimpleFilter.NOT_BLANK, SimpleFilter.BLANK,
        ];

        if (type && zeroInputTypes.indexOf(type) >= 0) {
            return 0;
        } else if (type === SimpleFilter.IN_RANGE) {
            return 2;
        }

        return 1;
    }

    // floating filter calls this when user applies filter from floating filter
    public onFloatingFilterChanged(type: string | null | undefined, value: V | null): void {
        this.setTypeFromFloatingFilter(type);
        this.setValueFromFloatingFilter(value);
        this.onUiChanged(true);
    }

    private setTypeFromFloatingFilter(type?: string | null): void {
        this.eTypes.forEach((eType, position) => {
            if (position === 0) {
                eType.setValue(type, true);
            } else {
                eType.setValue(this.optionsFactory.getDefaultOption(), true);
            }
        });
    }

    public getModelFromUi(): M | ICombinedSimpleModel<M> | null {
        const conditions = this.getUiCompleteConditions();
        if (conditions.length === 0) {
            return null;
        }

        if (this.maxNumConditions > 1 && conditions.length > 1) {
            return {
                filterType: this.getFilterType(),
                operator: this.getJoinOperator(),
                condition1: conditions[0],
                condition2: conditions[1],
                conditions
            };
        }

        return conditions[0];
    }

    protected getConditionTypes(): (ISimpleFilterModelType | null)[] {
        return this.eTypes.map(eType => eType.getValue() as ISimpleFilterModelType);
    }

    protected getConditionType(position: number): ISimpleFilterModelType | null {
        return this.eTypes[position].getValue() as ISimpleFilterModelType;
    }

    protected getJoinOperator(): JoinOperator {
        if (this.eJoinOperatorsOr.length === 0) {
            return this.defaultJoinOperator;
        }
        return this.eJoinOperatorsOr[0].getValue() === true ? 'OR' : 'AND';
    }

    protected areModelsEqual(a: M | ICombinedSimpleModel<M>, b: M | ICombinedSimpleModel<M>): boolean {
        // both are missing
        if (!a && !b) { return true; }

        // one is missing, other present
        if ((!a && b) || (a && !b)) { return false; }

        // one is combined, the other is not
        const aIsSimple = !(a as any).operator;
        const bIsSimple = !(b as any).operator;
        const oneSimpleOneCombined = (!aIsSimple && bIsSimple) || (aIsSimple && !bIsSimple);
        if (oneSimpleOneCombined) { return false; }

        let res: boolean;

        // otherwise both present, so compare
        if (aIsSimple) {
            const aSimple = a as M;
            const bSimple = b as M;

            res = this.areSimpleModelsEqual(aSimple, bSimple);
        } else {
            const aCombined = a as ICombinedSimpleModel<M>;
            const bCombined = b as ICombinedSimpleModel<M>;

            res = aCombined.operator === bCombined.operator
                && areEqual(aCombined.conditions, bCombined.conditions, (aModel, bModel) => this.areSimpleModelsEqual(aModel, bModel));
        }

        return res;
    }

    private shouldRefresh(newParams: SimpleFilterParams): boolean {
        const model = this.getModel();
        const conditions: ISimpleFilterModel[] | null = model ? ((<any>model).conditions ?? [model]) : null;

        // Do Not refresh when one of the existing condition options is not in new options list
        const newOptionsList = newParams.filterOptions?.map(
            option => typeof option === 'string' ? option : option.displayKey
        ) ?? this.getDefaultFilterOptions();

        const allConditionsExistInNewOptionsList = !conditions || conditions.every(condition =>
            newOptionsList.find(option => option === condition.type) !== undefined);
        if (!allConditionsExistInNewOptionsList) {
            return false;
        }

        // Check number of conditions vs maxNumConditions
        if (typeof newParams.maxNumConditions === 'number' && conditions && conditions.length > newParams.maxNumConditions) {
            return false;
        }

        return true;
    }

    refresh(newParams: SimpleFilterParams): boolean {
        if (!this.shouldRefresh(newParams)) {
            return false;
        }

        const parentRefreshed = super.refresh(newParams);
        if (!parentRefreshed) {
            return false;
        }

        this.setParams(newParams);
        this.removeConditionsAndOperators(0);
        this.createOption();
        this.setModel(this.getModel());

        return true;
    }

    protected setModelIntoUi(model: ISimpleFilterModel | ICombinedSimpleModel<M>): AgPromise<void> {
        const isCombined = (model as any).operator;

        if (isCombined) {
            let combinedModel = model as ICombinedSimpleModel<M>;
            if (!combinedModel.conditions) {
                combinedModel.conditions = [
                    combinedModel.condition1,
                    combinedModel.condition2
                ];
            }

            const numConditions = this.validateAndUpdateConditions(combinedModel.conditions);
            const numPrevConditions = this.getNumConditions();
            if (numConditions < numPrevConditions) {
                this.removeConditionsAndOperators(numConditions);
            } else if (numConditions > numPrevConditions) {
                for (let i = numPrevConditions; i < numConditions; i++) {
                    this.createJoinOperatorPanel();
                    this.createOption();
                }
            }

            const orChecked = combinedModel.operator === 'OR';
            this.eJoinOperatorsAnd.forEach(eJoinOperatorAnd => eJoinOperatorAnd.setValue(!orChecked, true));
            this.eJoinOperatorsOr.forEach(eJoinOperatorOr => eJoinOperatorOr.setValue(orChecked, true));

            combinedModel.conditions.forEach((condition, position) => {
                this.eTypes[position].setValue(condition.type, true);
                this.setConditionIntoUi(condition, position);
            });
        } else {
            const simpleModel = model as M;

            if (this.getNumConditions() > 1) {
                this.removeConditionsAndOperators(1);
            }

            this.eTypes[0].setValue(simpleModel.type, true);
            this.setConditionIntoUi(simpleModel, 0);
        }

        this.lastUiCompletePosition = this.getNumConditions() - 1;

        this.createMissingConditionsAndOperators();

        this.onUiChanged();

        return AgPromise.resolve();
    }

    private validateAndUpdateConditions(conditions: M[]): number {
        let numConditions = conditions.length;
        if (numConditions > this.maxNumConditions) {
            conditions.splice(this.maxNumConditions);
            warnOnce('Filter Model contains more conditions than "filterParams.maxNumConditions". Additional conditions have been ignored.');
            numConditions = this.maxNumConditions;
        }
        return numConditions;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        const model = this.getModel();

        if (model == null) { return true; }

        const { operator } = model as ICombinedSimpleModel<M>;
        const models: M[] = [];

        if (operator) {
            const combinedModel = model as ICombinedSimpleModel<M>;

            models.push(...(combinedModel.conditions ?? []));
        } else {
            models.push(model as M);
        }

        const combineFunction = operator && operator === 'OR' ? 'some' : 'every';

        return models[combineFunction](m => this.individualConditionPasses(params, m));
    }

    protected setParams(params: SimpleFilterParams): void {
        super.setParams(params);

        this.setNumConditions(params);

        this.defaultJoinOperator = this.getDefaultJoinOperator(params.defaultJoinOperator);
        this.filterPlaceholder = params.filterPlaceholder;

        this.optionsFactory = new OptionsFactory();
        this.optionsFactory.init(params, this.getDefaultFilterOptions());
        this.createFilterListOptions();

        this.createOption();
        this.createMissingConditionsAndOperators();

        if (this.isReadOnly()) {
            // only do this when read only (so no other focusable elements), otherwise the tab order breaks
            // as the tabbed layout managed focus feature will focus the body when it shouldn't
            this.eFilterBody.setAttribute('tabindex', '-1');
        }
    }

    private setNumConditions(params: SimpleFilterParams): void {
        if (params.suppressAndOrCondition != null) {
            warnOnce('Since v29.2 "filterParams.suppressAndOrCondition" is deprecated. Use "filterParams.maxNumConditions = 1" instead.');
        }
        if (params.alwaysShowBothConditions != null) {
            warnOnce('Since v29.2 "filterParams.alwaysShowBothConditions" is deprecated. Use "filterParams.numAlwaysVisibleConditions = 2" instead.');
        }
        this.maxNumConditions = params.maxNumConditions ?? (params.suppressAndOrCondition ? 1 : 2);
        if (this.maxNumConditions < 1) {
            warnOnce('"filterParams.maxNumConditions" must be greater than or equal to zero.');
            this.maxNumConditions = 1;
        }
        this.numAlwaysVisibleConditions = params.numAlwaysVisibleConditions ?? (params.alwaysShowBothConditions ? 2 : 1);
        if (this.numAlwaysVisibleConditions < 1) {
            warnOnce('"filterParams.numAlwaysVisibleConditions" must be greater than or equal to zero.');
            this.numAlwaysVisibleConditions = 1;
        }
        if (this.numAlwaysVisibleConditions > this.maxNumConditions) {
            warnOnce('"filterParams.numAlwaysVisibleConditions" cannot be greater than "filterParams.maxNumConditions".');
            this.numAlwaysVisibleConditions = this.maxNumConditions;
        }
    }

    private createOption(): void {
        const eType = this.createManagedBean(new AgSelect());
        this.eTypes.push(eType);
        eType.addCssClass('ag-filter-select');
        this.eFilterBody.appendChild(eType.getGui());

        const eConditionBody = this.createValueElement();
        this.eConditionBodies.push(eConditionBody);
        this.eFilterBody.appendChild(eConditionBody);

        this.putOptionsIntoDropdown(eType);
        this.resetType(eType);
        const position = this.getNumConditions() - 1;
        this.forEachPositionInput(position, (element) => this.resetInput(element));
        this.addChangedListeners(eType, position);
    }

    private createJoinOperatorPanel(): void {
        const eJoinOperatorPanel = document.createElement('div');
        this.eJoinOperatorPanels.push(eJoinOperatorPanel);
        eJoinOperatorPanel.classList.add('ag-filter-condition');

        const eJoinOperatorAnd =  this.createJoinOperator(this.eJoinOperatorsAnd, eJoinOperatorPanel, 'and');
        const eJoinOperatorOr = this.createJoinOperator(this.eJoinOperatorsOr, eJoinOperatorPanel, 'or');

        this.eFilterBody.appendChild(eJoinOperatorPanel);

        const index = this.eJoinOperatorPanels.length - 1;
        const uniqueGroupId = this.joinOperatorId++;
        this.resetJoinOperatorAnd(eJoinOperatorAnd, index, uniqueGroupId);
        this.resetJoinOperatorOr(eJoinOperatorOr, index, uniqueGroupId);

        if (!this.isReadOnly()) {
            eJoinOperatorAnd.onValueChange(this.listener);
            eJoinOperatorOr.onValueChange(this.listener);
        }
    }

    private createJoinOperator(eJoinOperators: AgRadioButton[], eJoinOperatorPanel: HTMLElement, andOr: string): AgRadioButton {
        const eJoinOperator = this.createManagedBean(new AgRadioButton());
        eJoinOperators.push(eJoinOperator);
        eJoinOperator.addCssClass('ag-filter-condition-operator');
        eJoinOperator.addCssClass(`ag-filter-condition-operator-${andOr}`);
        eJoinOperatorPanel.appendChild(eJoinOperator.getGui());
        return eJoinOperator;
    }

    private getDefaultJoinOperator(defaultJoinOperator?: JoinOperator): JoinOperator {
        return defaultJoinOperator === 'AND' || defaultJoinOperator === 'OR' ? defaultJoinOperator : 'AND';
    }

    private createFilterListOptions(): void {
        const filterOptions = this.optionsFactory.getFilterOptions();

        this.filterListOptions = filterOptions.map(option => 
            typeof option === 'string' ?
                this.createBoilerplateListOption(option) :
                this.createCustomListOption(option)
        );
    }

    private putOptionsIntoDropdown(eType: AgSelect): void {
        // Add specified options to condition drop-down.
        this.filterListOptions.forEach(listOption => {
            eType.addOption(listOption);
        });

        // Make drop-downs read-only if there is only one option.
        eType.setDisabled(this.filterListOptions.length <= 1);
    }

    private createBoilerplateListOption(option: string): ListOption {
        return { value: option, text: this.translate(option as keyof typeof FILTER_LOCALE_TEXT) };
    }

    private createCustomListOption(option: IFilterOptionDef): ListOption {
        const { displayKey } = option;
        const customOption = this.optionsFactory.getCustomOption(option.displayKey);
        return {
            value: displayKey,
            text: customOption ?
                this.localeService.getLocaleTextFunc()(customOption.displayKey, customOption.displayName) :
                this.translate(displayKey as keyof typeof FILTER_LOCALE_TEXT),
        };
    }

    /**
     * @deprecated As of v29.2 filters can have more than two conditions. Check `colDef.filterParams.maxNumConditions` instead.
     */
    public isAllowTwoConditions(): boolean {
        return this.maxNumConditions >= 2;
    }

    protected createBodyTemplate(): string {
        // created dynamically
        return '';
    }

    protected getCssIdentifier() {
        return 'simple-filter';
    }

    protected updateUiVisibility(): void {
        const joinOperator = this.getJoinOperator();
        this.updateNumConditions();

        // from here, the number of elements in all the collections is correct, so can just update the values/statuses
        this.updateConditionStatusesAndValues(this.lastUiCompletePosition!, joinOperator);
    }

    private updateNumConditions(): void {
        // Collection sizes are already correct if updated via API, so only need to handle UI updates here
        let lastUiCompletePosition = -1;
        let areAllConditionsUiComplete = true;
        for (let position = 0; position < this.getNumConditions(); position++) {
            if (this.isConditionUiComplete(position)) {
                lastUiCompletePosition = position
            } else {
                areAllConditionsUiComplete = false;
            }
        }
        if (this.shouldAddNewConditionAtEnd(areAllConditionsUiComplete)) {
            this.createJoinOperatorPanel();
            this.createOption();
        } else {
            const activePosition = this.lastUiCompletePosition ?? this.getNumConditions() - 2;
            if (lastUiCompletePosition < activePosition) {
                // remove any incomplete conditions at the end, excluding the active position
                this.removeConditionsAndOperators(activePosition + 1);
                const removeStartPosition = lastUiCompletePosition + 1;
                const numConditionsToRemove = activePosition - removeStartPosition;
                if (numConditionsToRemove > 0) {
                    this.removeConditionsAndOperators(removeStartPosition, numConditionsToRemove);
                }
                this.createMissingConditionsAndOperators();
            }
        }
        this.lastUiCompletePosition = lastUiCompletePosition;
    }

    private updateConditionStatusesAndValues(lastUiCompletePosition: number, joinOperator?: JoinOperator): void {
        this.eTypes.forEach((eType, position) => {
            const disabled = this.isConditionDisabled(position, lastUiCompletePosition);

            eType.setDisabled(disabled || this.filterListOptions.length <= 1);
            if (position === 1) {
                setDisabled(this.eJoinOperatorPanels[0], disabled);
                this.eJoinOperatorsAnd[0].setDisabled(disabled);
                this.eJoinOperatorsOr[0].setDisabled(disabled);
            }
        });

        this.eConditionBodies.forEach((element, index) => {
            setDisplayed(element, this.isConditionBodyVisible(index));
        });

        const orChecked = (joinOperator ?? this.getJoinOperator()) === 'OR';
        this.eJoinOperatorsAnd.forEach((eJoinOperatorAnd, index) => {
            eJoinOperatorAnd.setValue(!orChecked, true);
        });
        this.eJoinOperatorsOr.forEach((eJoinOperatorOr, index) => {
            eJoinOperatorOr.setValue(orChecked, true);
        });

        this.forEachInput((element, index, position, numberOfInputs) => {
            this.setElementDisplayed(element, index < numberOfInputs);
            this.setElementDisabled(element, this.isConditionDisabled(position, lastUiCompletePosition));
        });

        this.resetPlaceholder();
    }

    private shouldAddNewConditionAtEnd(areAllConditionsUiComplete: boolean): boolean {
        return areAllConditionsUiComplete && this.getNumConditions() < this.maxNumConditions && !this.isReadOnly();
    }

    private removeConditionsAndOperators(startPosition: number, deleteCount?: number): void {
        if (startPosition >= this.getNumConditions()) {
            return;
        }
        this.removeComponents(this.eTypes, startPosition, deleteCount);
        this.removeElements(this.eConditionBodies, startPosition, deleteCount);
        this.removeValueElements(startPosition, deleteCount);
        const joinOperatorIndex = Math.max(startPosition - 1, 0);
        this.removeElements(this.eJoinOperatorPanels, joinOperatorIndex, deleteCount);
        this.removeComponents(this.eJoinOperatorsAnd, joinOperatorIndex, deleteCount);
        this.removeComponents(this.eJoinOperatorsOr, joinOperatorIndex, deleteCount);
    }

    private removeElements(elements: HTMLElement[], startPosition: number, deleteCount?: number): void {
        const removedElements = this.removeItems(elements, startPosition, deleteCount);
        removedElements.forEach(element => removeFromParent(element));
    }

    protected removeComponents(components: Component[], startPosition: number, deleteCount?: number): void {
        const removedComponents = this.removeItems(components, startPosition, deleteCount);
        removedComponents.forEach(comp => {
            removeFromParent(comp.getGui());
            this.destroyBean(comp);
        });
    }

    protected removeItems<T>(items: T[], startPosition: number, deleteCount?: number): T[] {
        return deleteCount == null ? items.splice(startPosition) : items.splice(startPosition, deleteCount);
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams) {
        super.afterGuiAttached(params);

        this.resetPlaceholder();

        if (!params?.suppressFocus) {
            if (this.isReadOnly()) {
                // something needs focus otherwise keyboard navigation breaks, so focus the filter body
                this.eFilterBody.focus();
            } else {
                const firstInput = this.getInputs(0)[0];
                if (!firstInput) { return; }

                if (firstInput instanceof AgAbstractInputField) {
                    firstInput.getInputElement().focus();
                }
            }
        }
    }

    public afterGuiDetached(): void {
        super.afterGuiDetached();

        const appliedModel = this.getModel();

        // Reset temporary UI state that was applied to the DOM but not committed to the model
        this.resetUiToActiveModel(appliedModel);

        // remove incomplete positions
        let lastUiCompletePosition = -1;
        // as we remove incomplete positions, the last UI complete position will change
        let updatedLastUiCompletePosition = -1;
        let conditionsRemoved = false;
        const joinOperator = this.getJoinOperator();
        for (let position = this.getNumConditions() - 1; position >= 0; position--) {
            if (this.isConditionUiComplete(position)) {
                if (lastUiCompletePosition === -1) {
                    lastUiCompletePosition = position;
                    updatedLastUiCompletePosition = position;
                }
            } else {
                const shouldRemovePositionAtEnd = position >= this.numAlwaysVisibleConditions && !this.isConditionUiComplete(position - 1);
                const positionBeforeLastUiCompletePosition = position < lastUiCompletePosition;
                if (shouldRemovePositionAtEnd || positionBeforeLastUiCompletePosition) {
                    this.removeConditionsAndOperators(position, 1);
                    conditionsRemoved = true;
                    if (positionBeforeLastUiCompletePosition) {
                        updatedLastUiCompletePosition--;
                    }
                }
            }
        }
        let shouldUpdateConditionStatusesAndValues = false;
        if (this.getNumConditions() < this.numAlwaysVisibleConditions) {
            // if conditions have been removed, need to recreate new ones at the end up to the number required
            this.createMissingConditionsAndOperators();
            shouldUpdateConditionStatusesAndValues = true;
        }
        if (this.shouldAddNewConditionAtEnd(updatedLastUiCompletePosition === this.getNumConditions() - 1)) {
            this.createJoinOperatorPanel();
            this.createOption();
            shouldUpdateConditionStatusesAndValues = true;
        }
        if (shouldUpdateConditionStatusesAndValues) {
            this.updateConditionStatusesAndValues(updatedLastUiCompletePosition, joinOperator);
        }
        if (conditionsRemoved) {
            this.updateJoinOperatorsDisabled();
        }
        this.lastUiCompletePosition = updatedLastUiCompletePosition;
    }

    private getPlaceholderText(defaultPlaceholder: keyof typeof FILTER_LOCALE_TEXT, position: number): string {
        let placeholder = this.translate(defaultPlaceholder);
        if (isFunction(this.filterPlaceholder)) {
            const filterPlaceholderFn = this.filterPlaceholder as FilterPlaceholderFunction;
            const filterOptionKey = this.eTypes[position].getValue() as ISimpleFilterModelType;
            const filterOption = this.translate(filterOptionKey);
            placeholder = filterPlaceholderFn({
                filterOptionKey,
                filterOption,
                placeholder
            });
        } else if (typeof this.filterPlaceholder === 'string') {
            placeholder = this.filterPlaceholder;
        }

        return placeholder;
    }

    // allow sub-classes to reset HTML placeholders after UI update.
    protected resetPlaceholder(): void {
        const globalTranslate = this.localeService.getLocaleTextFunc();

        this.forEachInput((element, index, position, numberOfInputs) => {
            if (!(element instanceof AgAbstractInputField)) {
                return;
            }

            const placeholder =
                index === 0 && numberOfInputs > 1 ? 'inRangeStart' :
                index === 0 ? 'filterOoo' :
                'inRangeEnd';
            const ariaLabel =
                index === 0 && numberOfInputs > 1 ? globalTranslate('ariaFilterFromValue', 'Filter from value') :
                index === 0 ? globalTranslate('ariaFilterValue', 'Filter Value') :
                globalTranslate('ariaFilterToValue', 'Filter to Value');

            element.setInputPlaceholder(this.getPlaceholderText(placeholder, position));
            element.setInputAriaLabel(ariaLabel);
        });
    }

    protected setElementValue(element: E, value: V | null, fromFloatingFilter?: boolean): void {
        if (element instanceof AgAbstractInputField) {
            element.setValue(value != null ? String(value) : null, true);
        }
    }

    protected setElementDisplayed(element: E, displayed: boolean): void {
        if (element instanceof Component) {
            setDisplayed(element.getGui(), displayed);
        }
    }

    protected setElementDisabled(element: E, disabled: boolean): void {
        if (element instanceof Component) {
            setDisabled(element.getGui(), disabled);
        }
    }

    protected attachElementOnChange(element: E, listener: () => void): void {
        if (element instanceof AgAbstractInputField) {
            element.onValueChange(listener);
        }
    }

    protected forEachInput(cb: (element: E, index: number, position: number, numberOfInputs: number) => void): void {
        this.getConditionTypes().forEach((type, position) => {
            this.forEachPositionTypeInput(position, type, cb);
        });
    }

    protected forEachPositionInput(position: number, cb: (element: E, index: number, position: number, numberOfInputs: number) => void): void {
        const type = this.getConditionType(position);
        this.forEachPositionTypeInput(position, type, cb);
    }

    private forEachPositionTypeInput(position: number, type: ISimpleFilterModelType | null, cb: (element: E, index: number, position: number, numberOfInputs: number) => void): void {
        const numberOfInputs = this.getNumberOfInputs(type);
        const inputs = this.getInputs(position);
        for (let index = 0; index < inputs.length; index++) {
            const input = inputs[index];
            if (input != null) {
                cb(input, index, position, numberOfInputs);
            }
        }
    }

    private isConditionDisabled(position: number, lastUiCompletePosition: number): boolean {
        if (this.isReadOnly()) { return true; } // Read-only mode trumps everything.
        if (position === 0) { return false; } // Position 0 should typically be editable.

        // Only allow editing of a 2nd or later condition if the previous condition is complete and no subsequent conditions are complete.
        return position > lastUiCompletePosition + 1;
    }

    private isConditionBodyVisible(position: number): boolean {
        // Check that the condition needs inputs.
        const type = this.getConditionType(position);
        const numberOfInputs = this.getNumberOfInputs(type);
        return numberOfInputs > 0;
    }

    // returns true if the UI represents a working filter, eg all parts are filled out.
    // eg if text filter and textfield blank then returns false.
    protected isConditionUiComplete(position: number): boolean {
        if (position >= this.getNumConditions()) { return false; } // Condition doesn't exist.

        const type = this.getConditionType(position);

        if (type === SimpleFilter.EMPTY) { return false; }

        if (this.getValues(position).some(v => v == null)) {
            return false;
        }

        return true;
    }

    private getNumConditions(): number {
        return this.eTypes.length;
    }

    private getUiCompleteConditions(): M[] {
        const conditions: M[] = [];
        for (let position = 0; position < this.getNumConditions(); position++) {
            if (this.isConditionUiComplete(position)) {
                conditions.push(this.createCondition(position));
            }
        }
        return conditions;
    }

    private createMissingConditionsAndOperators(): void {
        if (this.isReadOnly()) { return; } // don't show incomplete conditions when read only
        for (let i = this.getNumConditions(); i < this.numAlwaysVisibleConditions; i++) {
            this.createJoinOperatorPanel();
            this.createOption();
        }
    }

    protected resetUiToDefaults(silent?: boolean): AgPromise<void> {
        this.removeConditionsAndOperators(this.isReadOnly() ? 1 : this.numAlwaysVisibleConditions);

        this.eTypes.forEach(eType => this.resetType(eType));

        this.eJoinOperatorsAnd.forEach((eJoinOperatorAnd, index) => this.resetJoinOperatorAnd(eJoinOperatorAnd, index, this.joinOperatorId + index));
        this.eJoinOperatorsOr.forEach((eJoinOperatorOr, index) => this.resetJoinOperatorOr(eJoinOperatorOr, index, this.joinOperatorId + index));
        this.joinOperatorId++

        this.forEachInput((element) => this.resetInput(element));

        this.resetPlaceholder();

        this.createMissingConditionsAndOperators();

        this.lastUiCompletePosition = null;

        if (!silent) {
            this.onUiChanged();
        }

        return AgPromise.resolve();
    }

    private resetType(eType: AgSelect): void {
        const translate = this.localeService.getLocaleTextFunc();
        const filteringLabel = translate('ariaFilteringOperator', 'Filtering operator');
        eType
            .setValue(this.optionsFactory.getDefaultOption(), true)
            .setAriaLabel(filteringLabel)
            .setDisabled(this.isReadOnly() || this.filterListOptions.length <= 1);
    }

    private resetJoinOperatorAnd(eJoinOperatorAnd: AgRadioButton, index: number, uniqueGroupId: number): void {
        this.resetJoinOperator(eJoinOperatorAnd, index, this.isDefaultOperator('AND'), this.translate('andCondition'), uniqueGroupId);
    }
   
    private resetJoinOperatorOr(eJoinOperatorOr: AgRadioButton, index: number, uniqueGroupId: number): void {
        this.resetJoinOperator(eJoinOperatorOr, index, this.isDefaultOperator('OR'), this.translate('orCondition'), uniqueGroupId);
    }

    private resetJoinOperator(eJoinOperator: AgRadioButton, index: number, value: boolean, label: string, uniqueGroupId: number): void {
        this.updateJoinOperatorDisabled(
            eJoinOperator
                .setValue(value, true)
                .setName(`ag-simple-filter-and-or-${this.getCompId()}-${uniqueGroupId}`)
                .setLabel(label),
            index
        );
    }

    private updateJoinOperatorsDisabled(): void {
        this.eJoinOperatorsAnd.forEach((eJoinOperator, index) => this.updateJoinOperatorDisabled(eJoinOperator, index));
        this.eJoinOperatorsOr.forEach((eJoinOperator, index) => this.updateJoinOperatorDisabled(eJoinOperator, index));
    }

    private updateJoinOperatorDisabled(eJoinOperator: AgRadioButton, index: number): void {
        eJoinOperator.setDisabled(this.isReadOnly() || index > 0);
    }

    private resetInput(element: E): void {
        this.setElementValue(element, null);
        this.setElementDisabled(element, this.isReadOnly());
    }

    // puts model values into the UI
    private setConditionIntoUi(model: M | null, position: number): void {
        const values = this.mapValuesFromModel(model);
        this.forEachInput((element, index, elPosition, _) => {
            if (elPosition !== position) { return; }

            this.setElementValue(element, values[index] != null ? values[index] : null);
        });
    }

    // after floating filter changes, this sets the 'value' section. this is implemented by the base class
    // (as that's where value is controlled), the 'type' part from the floating filter is dealt with in this class.
    private setValueFromFloatingFilter(value: V | null): void {
        this.forEachInput((element, index, position, _) => {
            this.setElementValue(element, index === 0 && position === 0 ? value : null, true);
        });
    }

    private isDefaultOperator(operator: JoinOperator): boolean {
        return operator === this.defaultJoinOperator;
    }

    private addChangedListeners(eType: AgSelect, position: number) {
        if (this.isReadOnly()) {
            return;
        }

        eType.onValueChange(this.listener);

        this.forEachPositionInput(position, (element) => {
            this.attachElementOnChange(element, this.listener);
        });
    }

    /** returns true if the row passes the said condition */
    protected individualConditionPasses(params: IDoesFilterPassParams, filterModel: M) {
        const cellValue = this.getCellValue(params.node);
        const values = this.mapValuesFromModel(filterModel);
        const customFilterOption = this.optionsFactory.getCustomOption(filterModel.type);

        const customFilterResult = this.evaluateCustomFilter(customFilterOption, values, cellValue);
        if (customFilterResult != null) {
            return customFilterResult;
        }

        if (cellValue == null) {
            return this.evaluateNullValue(filterModel.type);
        }

        return this.evaluateNonNullValue(values, cellValue, filterModel, params);
    }

    protected evaluateCustomFilter(
        customFilterOption: IFilterOptionDef | undefined,
        values: Tuple<V>,
        cellValue: V | null | undefined,
    ): boolean | undefined {
        if (customFilterOption == null) {
            return;
        }

        const { predicate } = customFilterOption;
        // only execute the custom filter if a value exists or a value isn't required, i.e. input is hidden
        if (predicate != null && !values.some(v => v == null)) {
            return predicate(values, cellValue);
        }

        // No custom filter invocation, indicate that to the caller.
        return;
    }

    protected isBlank(cellValue: V) {
        return cellValue == null ||
            (typeof cellValue === 'string' && cellValue.trim().length === 0);
    }

    protected hasInvalidInputs(): boolean {
        return false;
    }
}
