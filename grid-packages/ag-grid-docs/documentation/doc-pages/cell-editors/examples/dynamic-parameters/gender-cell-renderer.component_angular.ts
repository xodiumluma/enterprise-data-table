import { Component } from '@angular/core';
import { ICellRendererParams } from "@ag-grid-community/core";
import { ICellRendererAngularComp } from "@ag-grid-community/angular";

@Component({
    selector: 'app-gender-renderer',
    template: `
        <span>
            <i [class]="iconClass"> </i> {{ value }}
        </span>
    `
})
export class GenderCellRenderer implements ICellRendererAngularComp {
    public iconClass!: string;
    public value: any;

    agInit(params: ICellRendererParams): void {
        this.iconClass = params.value === 'Male' ? 'fa fa-male' : 'fa fa-female';
        this.value = params.value;
    }

    refresh(params: ICellRendererParams) {
        return false;
    }
}
