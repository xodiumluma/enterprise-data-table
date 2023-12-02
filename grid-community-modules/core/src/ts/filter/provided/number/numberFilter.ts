import { ISimpleFilterModel, SimpleFilter, SimpleFilterModelFormatter, Tuple } from '../simpleFilter';
import { ScalarFilter, Comparator, IScalarFilterParams } from '../scalarFilter';
import { makeNull } from '../../../utils/generic';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import { IFilterOptionDef, IFilterParams } from '../../../interfaces/iFilter';
import { setAriaRole } from '../../../utils/aria';
import { AgInputNumberField } from '../../../widgets/agInputNumberField';

export interface NumberFilterModel extends ISimpleFilterModel {
    /** Filter type is always `'number'` */
    filterType?: 'number';
    /**
     * The number value(s) associated with the filter.
     * Custom filters can have no values (hence both are optional).
     * Range filter has two values (from and to).
     */
    filter?: number | null;
    /**
     * Range filter `to` value.
     */
    filterTo?: number | null;
}

/**
 * Parameters provided by the grid to the `init` method of a `NumberFilter`.
 * Do not use in `colDef.filterParams` - see `INumberFilterParams` instead.
 */
export type NumberFilterParams<TData = any> = INumberFilterParams & IFilterParams<TData>;

/**
 * Parameters used in `colDef.filterParams` to configure a Number Filter (`agNumberColumnFilter`).
 */
export interface INumberFilterParams extends IScalarFilterParams {
    /**
     * When specified, the input field will be of type `text`, and this will be used as a regex of all the characters that are allowed to be typed.
     * This will be compared against any typed character and prevent the character from appearing in the input if it does not match.
     */
    allowedCharPattern?: string;
    /**
     * Typically used alongside `allowedCharPattern`, this provides a custom parser to convert the value entered in the filter inputs into a number that can be used for comparisons.
     */
    numberParser?: (text: string | null) => number | null;
    /**
     * Typically used alongside `allowedCharPattern`, this provides a custom formatter to convert the number value in the filter model
     * into a string to be used in the filter input. This is the inverse of the `numberParser`.
     */
    numberFormatter?: (value: number | null) => string | null;
}

export class NumberFilterModelFormatter extends SimpleFilterModelFormatter<number> {
    protected conditionToString(condition: NumberFilterModel, options?: IFilterOptionDef): string {
        const { numberOfInputs } = options || {};
        const isRange = condition.type == SimpleFilter.IN_RANGE || numberOfInputs === 2;

        if (isRange) {
            return `${this.formatValue(condition.filter)}-${this.formatValue(condition.filterTo)}`;
        }

        // cater for when the type doesn't need a value
        if (condition.filter != null) {
            return this.formatValue(condition.filter);
        }

        return `${condition.type}`;
    }
}

export function getAllowedCharPattern(filterParams?: NumberFilterParams): string | null {
    const { allowedCharPattern } = filterParams ?? {};

    return allowedCharPattern ?? null;
}

export class NumberFilter extends ScalarFilter<NumberFilterModel, number> {
    public static DEFAULT_FILTER_OPTIONS = [
        ScalarFilter.EQUALS,
        ScalarFilter.NOT_EQUAL,
        ScalarFilter.GREATER_THAN,
        ScalarFilter.GREATER_THAN_OR_EQUAL,
        ScalarFilter.LESS_THAN,
        ScalarFilter.LESS_THAN_OR_EQUAL,
        ScalarFilter.IN_RANGE,
        ScalarFilter.BLANK,
        ScalarFilter.NOT_BLANK,
    ];

    private readonly eValuesFrom: (AgInputTextField | AgInputNumberField)[] = [];
    private readonly eValuesTo: (AgInputTextField | AgInputNumberField)[] = [];

    private numberFilterParams: NumberFilterParams;
    private filterModelFormatter: SimpleFilterModelFormatter;

    constructor() {
        super('numberFilter');
    }

    refresh(params: NumberFilterParams): boolean {
        if (this.numberFilterParams.allowedCharPattern !== params.allowedCharPattern) {
            return false;
        }

        return super.refresh(params);
    }

    protected mapValuesFromModel(filterModel: NumberFilterModel | null): Tuple<number> {
        const { filter, filterTo, type } = filterModel || {};
        return [
            this.processValue(filter),
            this.processValue(filterTo),
        ].slice(0, this.getNumberOfInputs(type));
    }

    protected getDefaultDebounceMs(): number {
        return 500;
    }

    protected comparator(): Comparator<number> {
        return (left: number, right: number): number => {
            if (left === right) { return 0; }

            return left < right ? 1 : -1;
        };
    }

    protected setParams(params: NumberFilterParams): void {
        this.numberFilterParams = params;

        super.setParams(params);
        this.filterModelFormatter = new NumberFilterModelFormatter(this.localeService, this.optionsFactory, this.numberFilterParams.numberFormatter);
    }

    protected getDefaultFilterOptions(): string[] {
        return NumberFilter.DEFAULT_FILTER_OPTIONS;
    }

    protected setElementValue(element: AgInputTextField | AgInputNumberField, value: number | null, fromFloatingFilter?: boolean): void {
        // values from floating filter are directly from the input, not from the model
        const valueToSet = !fromFloatingFilter && this.numberFilterParams.numberFormatter
            ? this.numberFilterParams.numberFormatter(value ?? null)
            : value;
        super.setElementValue(element, valueToSet as any);
    }

    protected createValueElement(): HTMLElement {
        const allowedCharPattern = getAllowedCharPattern(this.numberFilterParams);

        const eCondition = document.createElement('div');
        eCondition.classList.add('ag-filter-body');
        setAriaRole(eCondition, 'presentation');

        this.createFromToElement(eCondition, this.eValuesFrom, 'from', allowedCharPattern);
        this.createFromToElement(eCondition, this.eValuesTo, 'to', allowedCharPattern);

        return eCondition;
    }

    private createFromToElement(eCondition: HTMLElement, eValues: (AgInputTextField | AgInputNumberField)[], fromTo: string, allowedCharPattern: string | null): void {
        const eValue = this.createManagedBean(allowedCharPattern ? new AgInputTextField({ allowedCharPattern }) : new AgInputNumberField());
        eValue.addCssClass(`ag-filter-${fromTo}`);
        eValue.addCssClass('ag-filter-filter');
        eValues.push(eValue);
        eCondition.appendChild(eValue.getGui());
    }

    protected removeValueElements(startPosition: number, deleteCount?: number): void {
        this.removeComponents(this.eValuesFrom, startPosition, deleteCount);
        this.removeComponents(this.eValuesTo, startPosition, deleteCount);
    }

    protected getValues(position: number): Tuple<number> {
        const result: Tuple<number> = [];
        this.forEachPositionInput(position, (element, index, _elPosition, numberOfInputs) => {
            if (index < numberOfInputs) {
                result.push(this.processValue(this.stringToFloat(element.getValue())));
            }
        });

        return result;
    }

    protected areSimpleModelsEqual(aSimple: NumberFilterModel, bSimple: NumberFilterModel): boolean {
        return aSimple.filter === bSimple.filter
            && aSimple.filterTo === bSimple.filterTo
            && aSimple.type === bSimple.type;
    }

    protected getFilterType(): 'number' {
        return 'number';
    }

    private processValue(value?: number | null): number | null {
        if (value == null) {
            return null;
        }
        return isNaN(value) ? null : value;
    }

    private stringToFloat(value?: string | number | null): number | null {
        if (typeof value === 'number') {
            return value;
        }

        let filterText = makeNull(value);

        if (filterText != null && filterText.trim() === '') {
            filterText = null;
        }

        if (this.numberFilterParams.numberParser) {
            return this.numberFilterParams.numberParser(filterText);
        }

        return filterText == null || filterText.trim() === '-' ? null : parseFloat(filterText);
    }

    protected createCondition(position: number): NumberFilterModel {
        const type = this.getConditionType(position);
        const model: NumberFilterModel = {
            filterType: this.getFilterType(),
            type
        };

        const values = this.getValues(position);
        if (values.length > 0) {
            model.filter = values[0];
        }
        if (values.length > 1) {
            model.filterTo = values[1];
        }

        return model;
    }

    protected getInputs(position: number): Tuple<AgInputTextField | AgInputNumberField> {
        if (position >= this.eValuesFrom.length) {
            return [null, null];
        }
        return [this.eValuesFrom[position], this.eValuesTo[position]];
    }

    public getModelAsString(model: ISimpleFilterModel): string {
        return this.filterModelFormatter.getModelAsString(model) ?? '';
    }

    protected hasInvalidInputs(): boolean {
        let invalidInputs = false;
        this.forEachInput(element => {
            if (!element.getInputElement().validity.valid) {
                invalidInputs = true;
                return;
            }
        });
        return invalidInputs;
    }
}
