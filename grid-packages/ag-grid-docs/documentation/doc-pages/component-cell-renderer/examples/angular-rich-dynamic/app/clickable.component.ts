import {Component, EventEmitter, Input, Output} from "@angular/core";

@Component({
    selector: 'ag-clickable',
    template: `
        <button style="height: 21px" (click)="click()" class="my-button">Click Me</button>
    `,
    styles: [
        `.my-button {
            line-height: 0.5;
            width: 100%;
        }`
    ]
})
export class ClickableComponent {
    @Input() cell: any;
    @Output() onClicked = new EventEmitter<boolean>();

    click(): void {
        this.onClicked.emit(this.cell);
    }
}
