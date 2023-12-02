import { ICellRendererComp, ICellRendererParams } from "@ag-grid-community/core";

export class MedalCellRenderer implements ICellRendererComp {
    eGui!: HTMLElement;
    params!: ICellRendererParams<IOlympicData, number>;

    // init method gets the details of the cell to be renderer
    init(params: ICellRendererParams<IOlympicData, number>) {
        this.params = params;
        this.eGui = document.createElement('span');
        this.eGui.innerHTML = new Array(params.value!).fill('#').join('');
    }

    getGui() {
        return this.eGui;
    }

    medalUserFunction() {
        console.log(`user function called for medal column: row = ${this.params.node.rowIndex}, column = ${this.params.column?.getId()}`);
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

