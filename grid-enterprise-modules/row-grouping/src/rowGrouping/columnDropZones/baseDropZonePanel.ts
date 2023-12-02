import {
    Autowired,
    Column,
    ColumnEventType,
    ColumnModel,
    Component,
    Context,
    DragAndDropService,
    DraggingEvent,
    DragSourceType,
    DropTarget,
    Events,
    EventService,
    FocusService,
    GridOptionsService,
    KeyCode,
    LoggerFactory,
    ManagedFocusFeature,
    PositionableFeature,

    _
} from "@ag-grid-community/core";
import { DropZoneColumnComp } from "./dropZoneColumnComp";

export interface BaseDropZonePanelParams {
    dragAndDropIcon: string;
    emptyMessage: string;
    title: string;
    icon: Element;
}

export interface BaseDropZonePanelBeans {
    gridOptionsService: GridOptionsService;
    eventService: EventService;
    context: Context;
    loggerFactory: LoggerFactory;
    dragAndDropService: DragAndDropService;
}

export type TDropZone = 'rowGroup' | 'pivot' | 'aggregation';

export abstract class BaseDropZonePanel extends Component {

    @Autowired('columnModel') private colModel: ColumnModel;

    private static STATE_NOT_DRAGGING = 'notDragging';
    private static STATE_NEW_COLUMNS_IN = 'newColumnsIn';
    private static STATE_REARRANGE_COLUMNS = 'rearrangeColumns';

    private state = BaseDropZonePanel.STATE_NOT_DRAGGING;

    private dropTarget: DropTarget;

    // when we are considering a drop from a dnd event,
    // the columns to be dropped go in here
    private potentialDndColumns: Column[];

    private guiDestroyFunctions: (() => void)[] = [];

    private params: BaseDropZonePanelParams;
    private beans: BaseDropZonePanelBeans;

    private childColumnComponents: DropZoneColumnComp[] = [];
    private insertIndex: number;

    // when this component is refreshed, we rip out all DOM elements and build it up
    // again from scratch. one exception is eColumnDropList, as we want to maintain the
    // scroll position between the refreshes, so we create one instance of it here and
    // reuse it.
    private eColumnDropList: HTMLElement;

    private positionableFeature: PositionableFeature;
    private resizeEnabled: boolean = false;

    protected abstract isColumnDroppable(column: Column): boolean;
    protected abstract updateColumns(columns: Column[]): void;
    protected abstract getExistingColumns(): Column[];
    protected abstract getIconName(): string;
    protected abstract getAriaLabel(): string;

    @Autowired('focusService') private readonly focusService: FocusService;

    constructor(private horizontal: boolean, private dropZonePurpose: TDropZone) {
        super(/* html */ `<div class="ag-unselectable" role="presentation"></div>`);
        this.addElementClasses(this.getGui());
        this.eColumnDropList = document.createElement('div');
        this.addElementClasses(this.eColumnDropList, 'list');
        _.setAriaRole(this.eColumnDropList, 'listbox');
    }

    public isHorizontal(): boolean {
        return this.horizontal;
    }

    public toggleResizable(resizable: boolean) {
        this.positionableFeature.setResizable(resizable ? { bottom: true } : false);
        this.resizeEnabled = resizable;
    }

    public setBeans(beans: BaseDropZonePanelBeans): void {
        this.beans = beans;
    }

    protected destroy(): void {
        this.destroyGui();
        super.destroy();
    }

    private destroyGui(): void {
        this.guiDestroyFunctions.forEach(func => func());
        this.guiDestroyFunctions.length = 0;
        this.childColumnComponents.length = 0;
        _.clearElement(this.getGui());
        _.clearElement(this.eColumnDropList);
    }

    public init(params: BaseDropZonePanelParams): void {
        this.params = params;

        this.createManagedBean(new ManagedFocusFeature(
            this.getFocusableElement(),
            {
                handleKeyDown: this.handleKeyDown.bind(this)
            }
        ));

        this.addManagedListener(this.beans.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.refreshGui.bind(this));
        this.addManagedPropertyListeners(['functionsReadOnly', 'rowGroupPanelSuppressSort', 'groupLockGroupColumns'], this.refreshGui.bind(this));

        this.setupDropTarget();

        this.positionableFeature = new PositionableFeature(this.getGui(), { minHeight: 100 });
        this.createManagedBean(this.positionableFeature);

        // we don't know if this bean will be initialised before columnModel.
        // if columnModel first, then below will work
        // if columnModel second, then below will put blank in, and then above event gets first when columnModel is set up
        this.refreshGui();
        _.setAriaLabel(this.eColumnDropList, this.getAriaLabel());
    }

    private handleKeyDown(e: KeyboardEvent) {
        const isVertical = !this.horizontal;

        let isNext = e.key === KeyCode.DOWN;
        let isPrevious = e.key === KeyCode.UP;

        if (!isVertical) {
            const isRtl = this.gridOptionsService.get('enableRtl');
            isNext = (!isRtl && e.key === KeyCode.RIGHT) || (isRtl && e.key === KeyCode.LEFT);
            isPrevious = (!isRtl && e.key === KeyCode.LEFT) || (isRtl && e.key === KeyCode.RIGHT);
        }

        if (!isNext && !isPrevious) { return; }

        const el = this.focusService.findNextFocusableElement(
            this.getFocusableElement(),
            false,
            isPrevious
        );

        if (el) {
            e.preventDefault();
            el.focus();
        }
    }

    private addElementClasses(el: Element, suffix?: string) {
        suffix = suffix ? `-${suffix}` : '';
        const direction = this.horizontal ? 'horizontal' : 'vertical';
        el.classList.add(`ag-column-drop${suffix}`, `ag-column-drop-${direction}${suffix}`);
    }

    private setupDropTarget(): void {
        this.dropTarget = {
            getContainer: this.getGui.bind(this),
            getIconName: this.getIconName.bind(this),
            onDragging: this.onDragging.bind(this),
            onDragEnter: this.onDragEnter.bind(this),
            onDragLeave: this.onDragLeave.bind(this),
            onDragStop: this.onDragStop.bind(this),
            isInterestedIn: this.isInterestedIn.bind(this)
        };

        this.beans.dragAndDropService.addDropTarget(this.dropTarget);
    }

    private isInterestedIn(type: DragSourceType): boolean {
        // not interested in row drags
        return type === DragSourceType.HeaderCell || type === DragSourceType.ToolPanel;
    }


    private minimumAllowedNewInsertIndex(): number {
        const numberOfLockedCols = this.gridOptionsService.get('groupLockGroupColumns');
        const numberOfGroupCols = this.colModel.getRowGroupColumns().length;
        if (numberOfLockedCols === -1) {
            return numberOfGroupCols;
        }
        return Math.min(numberOfLockedCols, numberOfGroupCols);
    }

    private checkInsertIndex(draggingEvent: DraggingEvent): boolean {
        const newIndex = this.getNewInsertIndex(draggingEvent);

        // <0 happens when drag is no a direction we are interested in, eg drag is up/down but in horizontal panel
        if (newIndex < 0) {
            return false;
        }

        const minimumAllowedIndex = this.minimumAllowedNewInsertIndex();
        const newAdjustedIndex = Math.max(minimumAllowedIndex, newIndex);

        const changed = newAdjustedIndex !== this.insertIndex;

        if (changed) {
            this.insertIndex = newAdjustedIndex;
        }

        return changed;
    }

    private getNewInsertIndex(draggingEvent: DraggingEvent): number {
        const mouseEvent = draggingEvent.event;
        const mouseLocation = this.horizontal ? mouseEvent.clientX : mouseEvent.clientY;

        const boundsList = this.childColumnComponents.map(col => (
            col.getGui().getBoundingClientRect()
        ));
        // find the non-ghost component we're hovering
        const hoveredIndex = boundsList.findIndex(rect => (
            this.horizontal ? (
                rect.right > mouseLocation && rect.left < mouseLocation
            ) : (
                rect.top < mouseLocation && rect.bottom > mouseLocation
            )
        ));

        // not hovering a non-ghost component
        if (hoveredIndex === -1) {
            const enableRtl = this.beans.gridOptionsService.get('enableRtl');

            // if mouse is below or right of all components then new index should be placed last
            const isLast = boundsList.every(rect => (
                mouseLocation > (this.horizontal ? rect.right : rect.bottom)
            ));

            if (isLast) {
                return enableRtl && this.horizontal ? 0 : this.childColumnComponents.length;
            }

            // if mouse is above or left of all components, new index is first
            const isFirst = boundsList.every(rect => (
                mouseLocation < (this.horizontal ? rect.left : rect.top)
            ));

            if (isFirst) {
                return enableRtl && this.horizontal ? this.childColumnComponents.length : 0;
            }
            
            // must be hovering a ghost, don't change the index
            return this.insertIndex;
        }

        // if the old index is equal to or less than the index of our new target
        // we need to shift right, to insert after rather than before
        if (this.insertIndex <= hoveredIndex) {
            return hoveredIndex + 1;
        }
        return hoveredIndex;
    }


    private checkDragStartedBySelf(draggingEvent: DraggingEvent): void {
        if (this.state !== BaseDropZonePanel.STATE_NOT_DRAGGING) {
            return;
        }

        this.state = BaseDropZonePanel.STATE_REARRANGE_COLUMNS;

        this.potentialDndColumns = draggingEvent.dragSource.getDragItem().columns || [];
        this.refreshGui();

        this.checkInsertIndex(draggingEvent);
        this.refreshGui();
    }

    private onDragging(draggingEvent: DraggingEvent): void {
        this.checkDragStartedBySelf(draggingEvent);

        if (this.checkInsertIndex(draggingEvent)) {
            this.refreshGui();
        }
    }

    private onDragEnter(draggingEvent: DraggingEvent): void {
        // this will contain all columns that are potential drops
        const dragColumns = draggingEvent.dragSource.getDragItem().columns || [];
        this.state = BaseDropZonePanel.STATE_NEW_COLUMNS_IN;

        // take out columns that are not droppable
        const goodDragColumns = dragColumns.filter(this.isColumnDroppable.bind(this));

        if (goodDragColumns.length > 0) {
            const hideColumnOnExit = this.isRowGroupPanel() && !this.gridOptionsService.get('suppressRowGroupHidesColumns') && !draggingEvent.fromNudge;

            if (hideColumnOnExit) {
                const dragItem = draggingEvent.dragSource.getDragItem();
                const columns = dragItem.columns;
                this.setColumnsVisible(columns, false, "uiColumnDragged");
            }

            this.potentialDndColumns = goodDragColumns;
            this.checkInsertIndex(draggingEvent);
            this.refreshGui();
        }
    }

    public setColumnsVisible(columns: Column[] | null | undefined, visible: boolean, source: ColumnEventType = "api") {
        if (columns) {
            const allowedCols = columns.filter(c => !c.getColDef().lockVisible);
            this.colModel.setColumnsVisible(allowedCols, visible, source);
        }
    }

    protected isPotentialDndColumns(): boolean {
        return _.existsAndNotEmpty(this.potentialDndColumns);
    }

    private isRowGroupPanel() {
        return this.dropZonePurpose === 'rowGroup';
    }

    private onDragLeave(draggingEvent: DraggingEvent): void {
        // if the dragging started from us, we remove the group, however if it started
        // some place else, then we don't, as it was only 'asking'

        if (this.state === BaseDropZonePanel.STATE_REARRANGE_COLUMNS) {
            const columns = draggingEvent.dragSource.getDragItem().columns || [];
            this.removeColumns(columns);
        }

        if (this.isPotentialDndColumns()) {
            const showColumnOnExit = this.isRowGroupPanel() && !this.gridOptionsService.get('suppressMakeColumnVisibleAfterUnGroup') && !draggingEvent.fromNudge;

            if (showColumnOnExit) {
                const dragItem = draggingEvent.dragSource.getDragItem();

                this.setColumnsVisible(dragItem.columns, true, "uiColumnDragged");
            }

            this.potentialDndColumns = [];
            this.refreshGui();
        }

        this.state = BaseDropZonePanel.STATE_NOT_DRAGGING;
    }

    private onDragStop(): void {
        if (this.isPotentialDndColumns()) {
            let success = false;

            if (this.state === BaseDropZonePanel.STATE_NEW_COLUMNS_IN) {
                this.addColumns(this.potentialDndColumns);
                success = true;
            } else {
                success = this.rearrangeColumns(this.potentialDndColumns);
            }

            this.potentialDndColumns = [];

            // If the function is passive, then we don't refresh, as we assume the client application
            // is going to call setRowGroups / setPivots / setValues at a later point which will then
            // cause a refresh. This gives a nice GUI where the ghost stays until the app has caught
            // up with the changes. However, if there was no change in the order, then we do need to
            // refresh to reset the columns
            if (!this.beans.gridOptionsService.get('functionsPassive') || !success) {
                this.refreshGui();
            }
        }

        this.state = BaseDropZonePanel.STATE_NOT_DRAGGING;
    }

    private removeColumns(columnsToRemove: Column[]): void {
        const newColumnList = this.getExistingColumns().filter(col => !_.includes(columnsToRemove, col));
        this.updateColumns(newColumnList);
    }

    private addColumns(columnsToAdd: Column[]): void {
        if (!columnsToAdd) { return; }
        const newColumnList = this.getExistingColumns().slice();
        const colsToAddNoDuplicates = columnsToAdd.filter(col => newColumnList.indexOf(col) < 0);
        _.insertArrayIntoArray(newColumnList, colsToAddNoDuplicates, this.insertIndex);
        this.updateColumns(newColumnList);
    }

    private rearrangeColumns(columnsToAdd: Column[]): boolean {
        const newColumnList = this.getNonGhostColumns().slice();
        _.insertArrayIntoArray(newColumnList, columnsToAdd, this.insertIndex);

        if (_.areEqual(newColumnList, this.getExistingColumns())) {
            return false;
        }

        this.updateColumns(newColumnList);
        return true;
    }

    public refreshGui(): void {
        // we reset the scroll position after the refresh.
        // if we don't do this, then the list will always scroll to the top
        // each time we refresh it. this is because part of the refresh empties
        // out the list which sets scroll to zero. so the user could be just
        // reordering the list - we want to prevent the resetting of the scroll.
        // this is relevant for vertical display only (as horizontal has no scroll)
        const scrollTop = this.eColumnDropList.scrollTop;
        const resizeEnabled = this.resizeEnabled;
        const focusedIndex = this.getFocusedItem();

        let alternateElement = this.focusService.findNextFocusableElement();

        if (!alternateElement) {
            alternateElement = this.focusService.findNextFocusableElement(undefined, false, true);
        }

        this.toggleResizable(false);
        this.destroyGui();

        this.addIconAndTitleToGui();
        this.addEmptyMessageToGui();
        this.addColumnsToGui();

        if (!this.isHorizontal()) {
            this.eColumnDropList.scrollTop = scrollTop;
        }

        if (resizeEnabled) {
            this.toggleResizable(resizeEnabled);
        }

        // focus should only be restored when keyboard mode
        // otherwise mouse clicks will cause containers to scroll
        // without no apparent reason.
        if (this.focusService.isKeyboardMode()) {
            this.restoreFocus(focusedIndex, alternateElement!);
        }
    }

    private getFocusedItem(): number {
        const eGui = this.getGui();
        const activeElement = this.gridOptionsService.getDocument().activeElement;

        if (!eGui.contains(activeElement)) { return - 1; }

        const items = Array.from(eGui.querySelectorAll('.ag-column-drop-cell'));

        return items.indexOf(activeElement as HTMLElement);
    }

    private restoreFocus(index: number, alternateElement: HTMLElement): void {
        const eGui = this.getGui();
        const items = Array.from(eGui.querySelectorAll('.ag-column-drop-cell'));

        if (index === -1) { return; }

        if (items.length === 0) {
            alternateElement.focus();
        }

        const indexToFocus = Math.min(items.length - 1, index);
        const el = items[indexToFocus] as HTMLElement;

        if (el) { el.focus(); }
    }

    private getNonGhostColumns(): Column[] {
        const existingColumns = this.getExistingColumns();

        if (this.isPotentialDndColumns()) {
            return existingColumns.filter(column => !_.includes(this.potentialDndColumns, column));
        }
        return existingColumns;
    }

    private addColumnsToGui(): void {
        const nonGhostColumns = this.getNonGhostColumns();
        const itemsToAddToGui: DropZoneColumnComp[] = nonGhostColumns.map(column => (
            this.createColumnComponent(column, false)
        ));

        if (this.isPotentialDndColumns()) {
            const dndColumns = this.potentialDndColumns.map(column => (
                this.createColumnComponent(column, true)
            ));
            if (this.insertIndex >= itemsToAddToGui.length) {
                itemsToAddToGui.push(...dndColumns);
            } else {
                itemsToAddToGui.splice(this.insertIndex, 0, ...dndColumns);
            }
        }

        this.appendChild(this.eColumnDropList);

        itemsToAddToGui.forEach((columnComponent, index) => {
            if (index > 0) {
                this.addArrow(this.eColumnDropList);
            }

            this.eColumnDropList.appendChild(columnComponent.getGui());
        });

        this.addAriaLabelsToComponents();
    }

    private addAriaLabelsToComponents(): void {
        this.childColumnComponents.forEach((comp, idx) => {
            const eGui = comp.getGui();
            _.setAriaPosInSet(eGui, idx + 1);
            _.setAriaSetSize(eGui, this.childColumnComponents.length);
        });
    }

    private createColumnComponent(column: Column, ghost: boolean): DropZoneColumnComp {
        const columnComponent = new DropZoneColumnComp(column, this.dropTarget, ghost, this.dropZonePurpose, this.horizontal);
        columnComponent.addEventListener(DropZoneColumnComp.EVENT_COLUMN_REMOVE, this.removeColumns.bind(this, [column]));

        this.beans.context.createBean(columnComponent);
        this.guiDestroyFunctions.push(() => this.destroyBean(columnComponent));

        if (!ghost) {
            this.childColumnComponents.push(columnComponent);
        }

        return columnComponent;
    }

    private addIconAndTitleToGui(): void {
        const eGroupIcon = this.params.icon;
        const eTitleBar = document.createElement('div');
        _.setAriaHidden(eTitleBar, true);
        this.addElementClasses(eTitleBar, 'title-bar');
        this.addElementClasses(eGroupIcon, 'icon');
        this.addOrRemoveCssClass('ag-column-drop-empty', this.isExistingColumnsEmpty());

        eTitleBar.appendChild(eGroupIcon);

        if (!this.horizontal) {
            const eTitle = document.createElement('span');
            this.addElementClasses(eTitle, 'title');
            eTitle.innerHTML = this.params.title;

            eTitleBar.appendChild(eTitle);
        }

        this.appendChild(eTitleBar);
    }

    private isExistingColumnsEmpty(): boolean {
        return this.getExistingColumns().length === 0;
    }

    private addEmptyMessageToGui(): void {
        if (!this.isExistingColumnsEmpty() || this.isPotentialDndColumns()) {
            return;
        }

        const eMessage = document.createElement('span');
        eMessage.innerHTML = this.params.emptyMessage;
        this.addElementClasses(eMessage, 'empty-message');
        this.eColumnDropList.appendChild(eMessage);
    }

    private addArrow(eParent: HTMLElement): void {
        // only add the arrows if the layout is horizontal
        if (this.horizontal) {
            // for RTL it's a left arrow, otherwise it's a right arrow
            const enableRtl = this.beans.gridOptionsService.get('enableRtl');
            const icon = _.createIconNoSpan(enableRtl ? 'smallLeft' : 'smallRight', this.beans.gridOptionsService)!;
            this.addElementClasses(icon, 'cell-separator');
            eParent.appendChild(icon);
        }
    }
}