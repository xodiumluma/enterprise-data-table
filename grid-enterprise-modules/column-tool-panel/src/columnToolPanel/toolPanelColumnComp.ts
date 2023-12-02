import {
    _,
    AgCheckbox,
    Autowired,
    Column,
    ColumnModel,
    ColumnPanelItemDragStartEvent,
    ColumnPanelItemDragEndEvent,
    Component,
    CssClassApplier,
    DragAndDropService,
    DragSource,
    DragSourceType,
    Events,
    ITooltipParams,
    KeyCode,
    PostConstruct,
    RefSelector,
    WithoutGridCommon,
    DragItem
} from "@ag-grid-community/core";
import { ColumnModelItem } from "./columnModelItem";
import { ModelItemUtils } from "./modelItemUtils";
import { ToolPanelContextMenu } from "./toolPanelContextMenu";

export class ToolPanelColumnComp extends Component {

    private static TEMPLATE = /* html */
        `<div class="ag-column-select-column" aria-hidden="true">
            <ag-checkbox ref="cbSelect" class="ag-column-select-checkbox"></ag-checkbox>
            <span class="ag-column-select-column-label" ref="eLabel"></span>
        </div>`;

    @Autowired('columnModel') private readonly columnModel: ColumnModel;
    @Autowired('dragAndDropService') private readonly dragAndDropService: DragAndDropService;
    @Autowired('modelItemUtils') private readonly modelItemUtils: ModelItemUtils;

    @RefSelector('eLabel') private eLabel: HTMLElement;
    @RefSelector('cbSelect') private cbSelect: AgCheckbox;

    private column: Column;
    private columnDept: number;
    private eDragHandle: Element;
    private displayName: string | null;
    private processingColumnStateChange = false;

    constructor(
        modelItem: ColumnModelItem,
        private readonly allowDragging: boolean,
        private readonly groupsExist: boolean,
        private readonly focusWrapper: HTMLElement
    ) {
        super();
        this.column = modelItem.getColumn();
        this.columnDept = modelItem.getDept();
        this.displayName = modelItem.getDisplayName();
    }

    @PostConstruct
    public init(): void {

        this.setTemplate(ToolPanelColumnComp.TEMPLATE);
        this.eDragHandle = _.createIconNoSpan('columnDrag', this.gridOptionsService)!;
        this.eDragHandle.classList.add('ag-drag-handle', 'ag-column-select-column-drag-handle');

        const checkboxGui = this.cbSelect.getGui();
        const checkboxInput = this.cbSelect.getInputElement();

        checkboxGui.insertAdjacentElement('afterend', this.eDragHandle);
        checkboxInput.setAttribute('tabindex', '-1');

        const displayNameSanitised: any = _.escapeString(this.displayName);
        this.eLabel.innerHTML = displayNameSanitised;

        // if grouping, we add an extra level of indent, to cater for expand/contract icons we need to indent for
        const indent = this.columnDept;
        if (this.groupsExist) {
            this.addCssClass('ag-column-select-add-group-indent');
        }
        this.addCssClass(`ag-column-select-indent-${indent}`);

        this.setupDragging();

        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, this.onColumnStateChanged.bind(this));
        this.addManagedListener(this.column, Column.EVENT_VALUE_CHANGED, this.onColumnStateChanged.bind(this));
        this.addManagedListener(this.column, Column.EVENT_PIVOT_CHANGED, this.onColumnStateChanged.bind(this));
        this.addManagedListener(this.column, Column.EVENT_ROW_GROUP_CHANGED, this.onColumnStateChanged.bind(this));
        this.addManagedListener(this.column, Column.EVENT_VISIBLE_CHANGED, this.onColumnStateChanged.bind(this));
        this.addManagedListener(this.focusWrapper, 'keydown', this.handleKeyDown.bind(this));
        this.addManagedListener(this.focusWrapper, 'contextmenu', this.onContextMenu.bind(this));

        this.addManagedPropertyListener('functionsReadOnly', this.onColumnStateChanged.bind(this));

        this.addManagedListener(this.cbSelect, Events.EVENT_FIELD_VALUE_CHANGED, this.onCheckboxChanged.bind(this));
        this.addManagedListener(this.eLabel, 'click', this.onLabelClicked.bind(this));

        this.onColumnStateChanged();
        this.refreshAriaLabel();

        this.setupTooltip();

        const classes = CssClassApplier.getToolPanelClassesFromColDef(this.column.getColDef(), this.gridOptionsService, this.column, null);
        classes.forEach(c => this.addOrRemoveCssClass(c, true));
    }

    public getColumn(): Column {
        return this.column;
    }

    private setupTooltip(): void {
        const refresh = () => {
            const newTooltipText = this.column.getColDef().headerTooltip;
            this.setTooltip(newTooltipText);
        };

        refresh();

        this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, refresh);
    }

    public getTooltipParams(): WithoutGridCommon<ITooltipParams> {
        const res = super.getTooltipParams();
        res.location = 'columnToolPanelColumn';
        res.colDef = this.column.getColDef();
        return res;
    }

    private onContextMenu(e: MouseEvent): void {
        const { column, gridOptionsService } = this;

        if (gridOptionsService.get('functionsReadOnly')) { return; }

        const contextMenu = this.createBean(new ToolPanelContextMenu(column, e, this.focusWrapper));
        this.addDestroyFunc(() => {
            if (contextMenu.isAlive()) {
                this.destroyBean(contextMenu);
            }
        })
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        if (e.key === KeyCode.SPACE) {
            e.preventDefault();
            if (this.isSelectable()) {
                this.onSelectAllChanged(!this.isSelected());
            }
        }
    }

    private onLabelClicked(): void {
        if (this.gridOptionsService.get('functionsReadOnly')) {
            return;
        }

        const nextState = !this.cbSelect.getValue();
        this.onChangeCommon(nextState);
    }

    private onCheckboxChanged(event: any): void {
        this.onChangeCommon(event.selected);
    }

    private onChangeCommon(nextState: boolean): void {
        // ignore lock visible columns
        if (this.cbSelect.isReadOnly()) { return; }

        this.refreshAriaLabel();

        // only want to action if the user clicked the checkbox, not if we are setting the checkbox because
        // of a change in the model
        if (this.processingColumnStateChange) {
            return;
        }

        this.modelItemUtils.setColumn(this.column, nextState, 'toolPanelUi');
    }

    private refreshAriaLabel(): void {
        const translate = this.localeService.getLocaleTextFunc();
        const columnLabel = translate('ariaColumn', 'Column');
        const state = this.cbSelect.getValue() ? translate('ariaVisible', 'visible') : translate('ariaHidden', 'hidden');
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');

        _.setAriaLabel(this.focusWrapper, `${this.displayName} ${columnLabel}`);
        this.cbSelect.setInputAriaLabel(`${visibilityLabel} (${state})`);
        _.setAriaDescribedBy(this.focusWrapper, this.cbSelect.getInputElement().id);
    }

    private setupDragging(): void {
        if (!this.allowDragging) {
            _.setDisplayed(this.eDragHandle, false);
            return;
        }

        let hideColumnOnExit = !this.gridOptionsService.get('suppressDragLeaveHidesColumns');
        const dragSource: DragSource = {
            type: DragSourceType.ToolPanel,
            eElement: this.eDragHandle,
            dragItemName: this.displayName,
            getDefaultIconName: () => hideColumnOnExit ? DragAndDropService.ICON_HIDE : DragAndDropService.ICON_NOT_ALLOWED,
            getDragItem: () => this.createDragItem(),
            onDragStarted: () => {
                hideColumnOnExit = !this.gridOptionsService.get('suppressDragLeaveHidesColumns');
                const event: WithoutGridCommon<ColumnPanelItemDragStartEvent> = {
                    type: Events.EVENT_COLUMN_PANEL_ITEM_DRAG_START,
                    column: this.column
                };
                this.eventService.dispatchEvent(event);
            },
            onDragStopped: () => {
                const event: WithoutGridCommon<ColumnPanelItemDragEndEvent> = {
                    type: Events.EVENT_COLUMN_PANEL_ITEM_DRAG_END
                };
                this.eventService.dispatchEvent(event);
            },
            onGridEnter: (dragItem: DragItem | null) => {
                if (hideColumnOnExit) {
                    // when dragged into the grid, restore the state that was active pre-drag
                    this.modelItemUtils.updateColumns({
                        columns: [this.column],
                        visibleState: dragItem?.visibleState,
                        pivotState: dragItem?.pivotState,
                        eventType: 'toolPanelUi'
                    })
                }
            },
            onGridExit: () => {
                if (hideColumnOnExit) {
                    // when dragged outside of the grid, mimic what happens when checkbox is disabled
                    // this handles the behaviour for pivot which is different to just hiding a column.
                    this.onChangeCommon(false);
                }
            }
        };

        this.dragAndDropService.addDragSource(dragSource, true);
        this.addDestroyFunc(() => this.dragAndDropService.removeDragSource(dragSource));
    }

    private createDragItem() {
        const colId = this.column.getColId();
        const visibleState = { [colId]: this.column.isVisible() };
        const pivotState = { [colId]: this.modelItemUtils.createPivotState(this.column) }
        return {
            columns: [this.column],
            visibleState,
            pivotState
        };
    }

    private onColumnStateChanged(): void {
        this.processingColumnStateChange = true;
        const isPivotMode = this.columnModel.isPivotMode();
        if (isPivotMode) {
            // if reducing, checkbox means column is one of pivot, value or group
            const anyFunctionActive = this.column.isAnyFunctionActive();
            this.cbSelect.setValue(anyFunctionActive);
        } else {
            // if not reducing, the checkbox tells us if column is visible or not
            this.cbSelect.setValue(this.column.isVisible());
        }

        let canBeToggled = true;
        let canBeDragged = true;
        if (isPivotMode) {
            // when in pivot mode, the item should be read only if:
            //  a) gui is not allowed make any changes
            const functionsReadOnly = this.gridOptionsService.get('functionsReadOnly');
            //  b) column is not allow any functions on it
            const noFunctionsAllowed = !this.column.isAnyFunctionAllowed();
            canBeToggled = !functionsReadOnly && !noFunctionsAllowed;
            canBeDragged = canBeToggled;
        } else {
            const { enableRowGroup, enableValue, lockPosition, suppressMovable, lockVisible } =
                this.column.getColDef();
            const forceDraggable = !!enableRowGroup || !!enableValue;
            const disableDraggable = !!lockPosition || !!suppressMovable;
            canBeToggled = !lockVisible;
            canBeDragged = forceDraggable || !disableDraggable;
        }

        this.cbSelect.setReadOnly(!canBeToggled);
        this.eDragHandle.classList.toggle('ag-column-select-column-readonly', !canBeDragged);
        this.addOrRemoveCssClass('ag-column-select-column-readonly', !canBeDragged && !canBeToggled);

        const checkboxPassive = isPivotMode && this.gridOptionsService.get('functionsPassive');
        this.cbSelect.setPassive(checkboxPassive);

        this.processingColumnStateChange = false;
    }

    public getDisplayName(): string | null {
        return this.displayName;
    }

    public onSelectAllChanged(value: boolean): void {
        if (value !== this.cbSelect.getValue()) {
            if (!this.cbSelect.isReadOnly()) {
                this.cbSelect.toggle();
            }
        }
    }

    public isSelected(): boolean | undefined {
        return this.cbSelect.getValue();
    }

    public isSelectable(): boolean {
        return !this.cbSelect.isReadOnly();
    }

    public isExpandable(): boolean {
        return false;
    }

    public setExpanded(value: boolean): void {
        console.warn('AG Grid: can not expand a column item that does not represent a column group header');
    }
}
