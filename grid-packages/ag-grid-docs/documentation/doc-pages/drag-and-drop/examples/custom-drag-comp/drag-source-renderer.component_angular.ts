import { ICellRendererAngularComp } from "@ag-grid-community/angular";
import { ICellRendererParams } from "@ag-grid-community/core";
import { Component } from "@angular/core";

@Component({
    selector: 'child-cell',
    template: `
        <div draggable="true" (dragstart)="onDragStart($event)">Drag Me!</div>`
})
export class DragSourceRenderer implements ICellRendererAngularComp {
    public params!: ICellRendererParams;

    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    onDragStart(dragEvent: DragEvent) {
        dragEvent.dataTransfer!.setData('text/plain', 'Dragged item with ID: ' + this.params.node.data.id);
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

