import { Component } from "@angular/core";

import { IFilterAngularComp } from "@ag-grid-community/angular";
import { IDoesFilterPassParams, IFilterParams } from "@ag-grid-community/core";

@Component({
    selector: 'number-component',
    template: `
      <div style="padding: 4px">
      <div style="font-weight: bold;">Greater than:</div>
      <div>
        <input style="margin: 4px 0 4px 0;" type="number" min="0" [(ngModel)]="filterText" (input)="onInputBoxChanged($event)" placeholder="Number of medals..."/>
      </div>
      </div>
    `
})
export class NumberFilterComponent implements IFilterAngularComp {
    filterParams!: IFilterParams;
    filterText: number | null | string = null;

    agInit(params: IFilterParams): void {
        this.filterParams = params;
    }

    doesFilterPass(params: IDoesFilterPassParams) {
        if (!this.isFilterActive()) { return true; }

        var { node } = params;

        var value = this.filterParams.getValue(node);

        if (value == null) return false;
        return Number(value) > Number(this.filterText);
    }

    isFilterActive() {
        return this.filterText !== null &&
            this.filterText !== undefined &&
            this.filterText !== '' &&
            this.isNumeric(this.filterText);
    }

    isNumeric(n: any) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    getModel() {
        return this.isFilterActive() ? Number(this.filterText) : null;
    }

    setModel(model: any) {
        this.filterText = model;
        this.filterParams.filterChangedCallback();
    }

    myMethodForTakingValueFromFloatingFilter(value: any) {
        this.filterText = value;
        this.filterParams.filterChangedCallback();
    }

    onInputBoxChanged() {
        this.filterParams.filterChangedCallback();
    }
}
