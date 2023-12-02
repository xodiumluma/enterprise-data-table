import { Column, TextFormatter, ValueFormatterParams, ValueFormatterService } from '@ag-grid-community/core';
import { ISetDisplayValueModel, SetFilterDisplayValue } from './iSetDisplayValueModel';

export class FlatSetDisplayValueModel<V> implements ISetDisplayValueModel<V> {
    /** All keys that are currently displayed, after the mini-filter has been applied. */
    private displayedKeys: (string | null)[] = [];

    constructor(
        private readonly valueFormatterService: ValueFormatterService,
        private readonly valueFormatter: ((params: ValueFormatterParams) => string) | undefined,
        private readonly formatter: TextFormatter,
        private readonly column: Column
    ) {}

    public updateDisplayedValuesToAllAvailable(
        _getValue: (key: string | null) => V | null,
        _allKeys: Iterable<string | null> | undefined,
        availableKeys: Set<string | null>
    ): void {
        this.displayedKeys = Array.from(availableKeys);
    }

    public updateDisplayedValuesToMatchMiniFilter(
        getValue: (key: string | null) => V | null,
        _allKeys: Iterable<string | null> | undefined, 
        availableKeys: Set<string | null>,
        matchesFilter: (valueToCheck: string | null) => boolean,
        nullMatchesFilter: boolean
    ): void {
        this.displayedKeys = [];

        for (let key of availableKeys) {
            if (key == null) {
                if (nullMatchesFilter) {
                    this.displayedKeys.push(key);
                }
            } else {
                const value = getValue(key);
                const valueFormatterValue = this.valueFormatterService.formatValue(
                    this.column, null, value, this.valueFormatter, false);

                const textFormatterValue = this.formatter(valueFormatterValue);

                if (matchesFilter(textFormatterValue)) {
                    this.displayedKeys.push(key);
                }
            }
        }
    }

    public getDisplayedValueCount(): number {
        return this.displayedKeys.length;
    }

    public getDisplayedItem(index: number): string | null {
        return this.displayedKeys[index];
    }

    getSelectAllItem(): string {
        return SetFilterDisplayValue.SELECT_ALL;
    }

    getAddSelectionToFilterItem(): string {
        return SetFilterDisplayValue.ADD_SELECTION_TO_FILTER;
    }


    public getDisplayedKeys(): (string | null)[] {
        return this.displayedKeys;
    }

    public forEachDisplayedKey(func: (key: string | null) => void): void {
        this.displayedKeys.forEach(func);
    }

    public someDisplayedKey(func: (key: string | null) => boolean): boolean {
        return this.displayedKeys.some(func);
    }

    public hasGroups(): boolean {
        return false;
    }

    public refresh(): void {
        // not used
    }
}