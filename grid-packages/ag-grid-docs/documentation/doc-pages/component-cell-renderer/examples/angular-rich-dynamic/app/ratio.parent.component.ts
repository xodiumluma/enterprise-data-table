import { Component } from "@angular/core";
import { ICellRendererParams } from "@ag-grid-community/core";
import { ICellRendererAngularComp } from "@ag-grid-community/angular";

// both this and the parent component could be folded into one component as they're both simple, but it illustrates how
// a fuller example could work
@Component({
    selector: 'ratio-cell',
    template: `
        <ag-ratio [topRatio]="params?.value?.top" [bottomRatio]="params?.value?.bottom"></ag-ratio>
    `,
    styles: [`
        ag-ratio {
            height:30px;
            margin: 5px;
            display: block;
            overflow: hidden;
            border: 1px solid #ccc;
            border-radius: 6px;
        }
    `]
})
export class RatioParentComponent implements ICellRendererAngularComp {
    public params: ICellRendererParams = {
        value: { top: 0.25, bottom: 0.75 }
    } as ICellRendererParams;

    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    refresh(): boolean {
        return false;
    }
}
