import { AgInputTextArea } from "../../widgets/agInputTextArea";
import { ICellEditorComp, ICellEditorParams } from "../../interfaces/iCellEditor";
import { PopupComponent } from "../../widgets/popupComponent";
import { RefSelector } from "../../widgets/componentAnnotations";
import { exists } from "../../utils/generic";
import { KeyCode } from '../../constants/keyCode';

export interface ILargeTextEditorParams extends ICellEditorParams {
    /**
     * Max number of characters to allow.
     * @default 200
     */
    maxLength: number;
    /**
     * Number of character rows to display.
     * @default 10
     */
    rows: number;
    /**
     * Number of character columns to display.
     * @default 60
     */
    cols: number;
}

export class LargeTextCellEditor extends PopupComponent implements ICellEditorComp {
    private static TEMPLATE = /* html */
        `<div class="ag-large-text">
            <ag-input-text-area ref="eTextArea" class="ag-large-text-input"></ag-input-text-area>
        </div>`;

    private params: ILargeTextEditorParams;
    @RefSelector("eTextArea") private eTextArea: AgInputTextArea;
    private focusAfterAttached: boolean;

    constructor() {
        super(LargeTextCellEditor.TEMPLATE);
    }

    public init(params: ILargeTextEditorParams): void {
        this.params = params;
        this.focusAfterAttached = params.cellStartedEdit;

        this.eTextArea
            .setMaxLength(params.maxLength || 200)
            .setCols(params.cols || 60)
            .setRows(params.rows || 10);

        if (exists(params.value, true)) {
            this.eTextArea.setValue(params.value.toString(), true);
        }

        this.addGuiEventListener('keydown', this.onKeyDown.bind(this));
        this.activateTabIndex();
    }

    private onKeyDown(event: KeyboardEvent): void {
        const key = event.key;

        if (key === KeyCode.LEFT ||
            key === KeyCode.UP ||
            key === KeyCode.RIGHT ||
            key === KeyCode.DOWN ||
            (event.shiftKey && key === KeyCode.ENTER)) { // shift+enter allows for newlines
            event.stopPropagation();
        }
    }

    public afterGuiAttached(): void {
        const translate = this.localeService.getLocaleTextFunc();

        this.eTextArea.setInputAriaLabel(translate('ariaInputEditor', 'Input Editor'));

        if (this.focusAfterAttached) {
            this.eTextArea.getFocusableElement().focus();
        }
    }

    public getValue(): any {
        const value = this.eTextArea.getValue();
        if (!exists(value) && !exists(this.params.value)) {
            return this.params.value;
        }
        return this.params.parseValue(value!);
    }
}
