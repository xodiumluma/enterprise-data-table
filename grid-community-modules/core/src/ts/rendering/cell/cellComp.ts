import { Column } from "../../entities/column";
import { RowNode } from "../../entities/rowNode";
import { Beans } from "./../beans";
import { Component } from "../../widgets/component";
import { ICellEditorComp, ICellEditorParams } from "../../interfaces/iCellEditor";
import { ICellRendererComp } from "./../cellRenderers/iCellRenderer";
import { CheckboxSelectionComponent } from "./../checkboxSelectionComponent";
import { RowCtrl } from "./../row/rowCtrl";
import { RowDragComp } from "./../row/rowDragComp";
import { PopupEditorWrapper } from "./../cellEditors/popupEditorWrapper";
import { DndSourceComp } from "./../dndSourceComp";
import { TooltipParentComp } from "../../widgets/customTooltipFeature";
import { setAriaRole } from "../../utils/aria";
import { escapeString } from "../../utils/string";
import { missing } from "../../utils/generic";
import { addStylesToElement, clearElement, loadTemplate, removeFromParent } from "../../utils/dom";
import { CellCtrl, ICellComp } from "./cellCtrl";
import { UserCompDetails } from "../../components/framework/userComponentFactory";
import { browserSupportsPreventScroll } from "../../utils/browser";
import { CellStyle } from "../../entities/colDef";

export class CellComp extends Component implements TooltipParentComp {

    private eCellWrapper: HTMLElement | undefined;
    private eCellValue: HTMLElement | undefined;

    private beans: Beans;
    private column: Column;
    private rowNode: RowNode;
    private eRow: HTMLElement;

    private includeSelection: boolean;
    private includeRowDrag: boolean;
    private includeDndSource: boolean;

    private forceWrapper: boolean;

    private checkboxSelectionComp: CheckboxSelectionComponent | undefined;
    private dndSourceComp: DndSourceComp | undefined;
    private rowDraggingComp: RowDragComp | undefined;

    private hideEditorPopup: Function | null | undefined;
    private cellEditorPopupWrapper: PopupEditorWrapper | undefined;
    private cellEditor: ICellEditorComp | null | undefined;
    private cellEditorGui: HTMLElement | null;

    private cellRenderer: ICellRendererComp | null | undefined;
    private cellRendererGui: HTMLElement | null;
    private cellRendererClass: any;

    private rowCtrl: RowCtrl | null;

    private cellCtrl: CellCtrl;

    private firstRender: boolean;

    // every time we go into edit mode, or back again, this gets incremented.
    // it's the components way of dealing with the async nature of framework components,
    // so if a framework component takes a while to be created, we know if the object
    // is still relevant when creating is finished. eg we could click edit / un-edit 20
    // times before the first React edit component comes back - we should discard
    // the first 19.
    private rendererVersion = 0;
    private editorVersion = 0;

    constructor(beans: Beans, cellCtrl: CellCtrl,
        printLayout: boolean, eRow: HTMLElement, editingRow: boolean) {
        super();
        this.beans = beans;
        this.column = cellCtrl.getColumn();
        this.rowNode = cellCtrl.getRowNode();
        this.rowCtrl = cellCtrl.getRowCtrl();
        this.eRow = eRow;
        this.cellCtrl = cellCtrl;

        this.setTemplate(/* html */`<div comp-id="${this.getCompId()}"/>`);

        const eGui = this.getGui();

        this.forceWrapper = cellCtrl.isForceWrapper();

        this.refreshWrapper(false);

        const setAttribute = (name: string, value: string | null | undefined) => {
            if (value != null && value != '') {
                eGui.setAttribute(name, value);
            } else {
                eGui.removeAttribute(name);
            }
        };

        setAriaRole(eGui, cellCtrl.getCellAriaRole());
        setAttribute('col-id', cellCtrl.getColumnIdSanitised());
        const tabIndex = cellCtrl.getTabIndex();
        if (tabIndex !== undefined) {
            setAttribute('tabindex', tabIndex.toString());
        }

        const compProxy: ICellComp = {
            addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
            setUserStyles: (styles: CellStyle) => addStylesToElement(eGui, styles),
            getFocusableElement: () => this.getFocusableElement(),
            
            setIncludeSelection: include => this.includeSelection = include,
            setIncludeRowDrag: include => this.includeRowDrag = include,
            setIncludeDndSource: include => this.includeDndSource = include,

            setRenderDetails: (compDetails, valueToDisplay, force) =>
                this.setRenderDetails(compDetails, valueToDisplay, force),
            setEditDetails: (compDetails, popup, position) =>
                this.setEditDetails(compDetails, popup, position),

            getCellEditor: () => this.cellEditor || null,
            getCellRenderer: () => this.cellRenderer || null,
            getParentOfValue: () => this.getParentOfValue()
        };

        cellCtrl.setComp(compProxy, this.getGui(), this.eCellWrapper, printLayout, editingRow);
    }

    private getParentOfValue(): HTMLElement {
        if (this.eCellValue) {
            // if not editing, and using wrapper, then value goes in eCellValue
            return this.eCellValue;
        }
        if (this.eCellWrapper) {
            // if editing, and using wrapper, value (cell editor) goes in eCellWrapper
            return this.eCellWrapper;
        }

        // if editing or rendering, and not using wrapper, value (or comp) is directly inside cell
        return this.getGui();
    }

    private setRenderDetails(compDetails: UserCompDetails | undefined, valueToDisplay: any, forceNewCellRendererInstance: boolean): void {
        // this can happen if the users asks for the cell to refresh, but we are not showing the vale as we are editing
        const isInlineEditing = this.cellEditor && !this.cellEditorPopupWrapper;
        if (isInlineEditing) { return; }

        // this means firstRender will be true for one pass only, as it's initialised to undefined
        this.firstRender = this.firstRender == null;

        // if display template has changed, means any previous Cell Renderer is in the wrong location
        const controlWrapperChanged = this.refreshWrapper(false);
        this.refreshEditStyles(false);

        // all of these have dependencies on the eGui, so only do them after eGui is set
        if (compDetails) {
            const neverRefresh = forceNewCellRendererInstance || controlWrapperChanged;
            const cellRendererRefreshSuccessful = neverRefresh ? false : this.refreshCellRenderer(compDetails);
            if (!cellRendererRefreshSuccessful) {
                this.destroyRenderer();
                this.createCellRendererInstance(compDetails);
            }
        } else {
            this.destroyRenderer();
            this.insertValueWithoutCellRenderer(valueToDisplay);
        }
    }

    private setEditDetails(compDetails: UserCompDetails | undefined, popup?: boolean, position?: 'over' | 'under'): void {
        if (compDetails) {
            this.createCellEditorInstance(compDetails, popup, position);
        } else {
            this.destroyEditor();
        }
    }

    private removeControls(): void {
        this.checkboxSelectionComp = this.beans.context.destroyBean(this.checkboxSelectionComp);
        this.dndSourceComp = this.beans.context.destroyBean(this.dndSourceComp);
        this.rowDraggingComp = this.beans.context.destroyBean(this.rowDraggingComp);
    }

    // returns true if wrapper was changed
    private refreshWrapper(editing: boolean): boolean {
        const providingControls = this.includeRowDrag || this.includeDndSource || this.includeSelection;
        const usingWrapper = providingControls || this.forceWrapper;

        const putWrapperIn = usingWrapper && this.eCellWrapper == null;
        if (putWrapperIn) {
            this.eCellWrapper = loadTemplate(/* html */`<div class="ag-cell-wrapper" role="presentation"></div>`);
            this.getGui().appendChild(this.eCellWrapper);
        }
        const takeWrapperOut = !usingWrapper && this.eCellWrapper != null;
        if (takeWrapperOut) {
            removeFromParent(this.eCellWrapper!);
            this.eCellWrapper = undefined;
        }

        this.addOrRemoveCssClass('ag-cell-value', !usingWrapper);

        const usingCellValue = !editing && usingWrapper;
        const putCellValueIn = usingCellValue && this.eCellValue == null;
        if (putCellValueIn) {
            this.eCellValue = loadTemplate(/* html */`<span class="ag-cell-value" role="presentation"></span>`);
            this.eCellWrapper!.appendChild(this.eCellValue);
        }
        const takeCellValueOut = !usingCellValue && this.eCellValue != null;
        if (takeCellValueOut) {
            removeFromParent(this.eCellValue!);
            this.eCellValue = undefined;
        }

        const templateChanged = putWrapperIn || takeWrapperOut || putCellValueIn || takeCellValueOut;

        if (templateChanged) {
            this.removeControls();
        }

        if (!editing) {
            if (providingControls) {
                this.addControls();
            }
        }

        return templateChanged;
    }

    private addControls(): void {
        if (this.includeRowDrag) {
            if (this.rowDraggingComp == null) {
                this.rowDraggingComp = this.cellCtrl.createRowDragComp();
                if (this.rowDraggingComp) {
                    // put the checkbox in before the value
                    this.eCellWrapper!.insertBefore(this.rowDraggingComp.getGui(), this.eCellValue!);
                }
            }
        }

        if (this.includeDndSource) {
            if (this.dndSourceComp == null) {
                this.dndSourceComp = this.cellCtrl.createDndSource();
                // put the checkbox in before the value
                this.eCellWrapper!.insertBefore(this.dndSourceComp.getGui(), this.eCellValue!);
            }
        }

        if (this.includeSelection) {
            if (this.checkboxSelectionComp == null) {
                this.checkboxSelectionComp = this.cellCtrl.createSelectionCheckbox();
                this.eCellWrapper!.insertBefore(this.checkboxSelectionComp.getGui(), this.eCellValue!);
            }
        }
    }

    private createCellEditorInstance(compDetails: UserCompDetails, popup?: boolean, position?: 'over' | 'under'): void {
        const versionCopy = this.editorVersion;

        const cellEditorPromise = compDetails.newAgStackInstance();
        if (!cellEditorPromise) { return; } // if empty, userComponentFactory already did a console message

        const { params } = compDetails;
        cellEditorPromise.then(c => this.afterCellEditorCreated(versionCopy, c!, params, popup, position));

        // if we don't do this, and editor component is async, then there will be a period
        // when the component isn't present and keyboard navigation won't work - so example
        // of user hitting tab quickly (more quickly than renderers getting created) won't work
        const cellEditorAsync = missing(this.cellEditor);
        if (cellEditorAsync && params.cellStartedEdit) {
            this.cellCtrl.focusCell(true);
        }
    }

    private insertValueWithoutCellRenderer(valueToDisplay: any): void {
        const eParent = this.getParentOfValue();
        clearElement(eParent);

        const escapedValue = valueToDisplay != null ? escapeString(valueToDisplay) : null;
        if (escapedValue != null) {
            eParent.innerHTML = escapedValue;
        }
    }

    private destroyEditorAndRenderer(): void {
        this.destroyRenderer();
        this.destroyEditor();
    }

    private destroyRenderer(): void {
        const {context} = this.beans;
        this.cellRenderer = context.destroyBean(this.cellRenderer);
        removeFromParent(this.cellRendererGui);
        this.cellRendererGui = null;
        this.rendererVersion++;
    }

    private destroyEditor(): void {
        const {context} = this.beans;

        if (this.hideEditorPopup) { this.hideEditorPopup(); }
        this.hideEditorPopup = undefined;

        this.cellEditor = context.destroyBean(this.cellEditor);
        this.cellEditorPopupWrapper = context.destroyBean(this.cellEditorPopupWrapper);

        removeFromParent(this.cellEditorGui);
        this.cellEditorGui = null;

        this.editorVersion++;
    }

    private refreshCellRenderer(compClassAndParams: UserCompDetails): boolean {
        if (this.cellRenderer == null || this.cellRenderer.refresh == null) { return false; }

        // if different Cell Renderer configured this time (eg user is using selector, and
        // returns different component) then don't refresh, force recreate of Cell Renderer
        if (this.cellRendererClass !== compClassAndParams.componentClass) { return false; }

        // take any custom params off of the user
        const result = this.cellRenderer.refresh(compClassAndParams.params);

        // NOTE on undefined: previous version of the cellRenderer.refresh() interface
        // returned nothing, if the method existed, we assumed it refreshed. so for
        // backwards compatibility, we assume if method exists and returns nothing,
        // that it was successful.
        return result === true || result === undefined;
    }

    private createCellRendererInstance(compDetails: UserCompDetails): void {
        // never use task service if animation frame service is turned off.
        // and lastly we never use it if doing auto-height, as the auto-height service checks the
        // row height directly after the cell is created, it doesn't wait around for the tasks to complete        
        const suppressAnimationFrame = this.beans.gridOptionsService.get('suppressAnimationFrame');
        const useTaskService = !suppressAnimationFrame;

        const displayComponentVersionCopy = this.rendererVersion;

        const {componentClass} = compDetails;

        const createCellRendererFunc = () => {
            const staleTask = this.rendererVersion !== displayComponentVersionCopy || !this.isAlive();
            if (staleTask) { return; }

            // this can return null in the event that the user has switched from a renderer component to nothing, for example
            // when using a cellRendererSelect to return a component or null depending on row data etc
            const componentPromise = compDetails.newAgStackInstance();
            const callback = this.afterCellRendererCreated.bind(this, displayComponentVersionCopy, componentClass);
            if (componentPromise) {
                componentPromise.then(callback);
            }
        };

        // we only use task service when rendering for first time, which means it is not used when doing edits.
        // if we changed this (always use task service) would make sense, however it would break tests, possibly
        // test of users.
        if (useTaskService && this.firstRender) {
            this.beans.animationFrameService.createTask(createCellRendererFunc, this.rowNode.rowIndex!, 'createTasksP2');
        } else {
            createCellRendererFunc();
        }
    }

    public getCtrl(): CellCtrl {
        return this.cellCtrl;
    }

    public getRowCtrl(): RowCtrl | null {
        return this.rowCtrl;
    }

    public getCellRenderer(): ICellRendererComp | null | undefined {
        return this.cellRenderer;
    }

    public getCellEditor(): ICellEditorComp | null | undefined {
        return this.cellEditor;
    }

    private afterCellRendererCreated(cellRendererVersion: number, cellRendererClass: any, cellRenderer: ICellRendererComp): void {
        const staleTask = !this.isAlive() || cellRendererVersion !== this.rendererVersion;

        if (staleTask) {
            this.beans.context.destroyBean(cellRenderer);
            return;
        }

        this.cellRenderer = cellRenderer;
        this.cellRendererClass = cellRendererClass;
        this.cellRendererGui = this.cellRenderer.getGui();

        if (this.cellRendererGui != null) {
            const eParent = this.getParentOfValue();
            clearElement(eParent);
            eParent.appendChild(this.cellRendererGui);
        }
    }

    private afterCellEditorCreated(requestVersion: number, cellEditor: ICellEditorComp, params: ICellEditorParams, popup?: boolean, position?: 'over' | 'under'): void {

        // if editingCell=false, means user cancelled the editor before component was ready.
        // if versionMismatch, then user cancelled the edit, then started the edit again, and this
        //   is the first editor which is now stale.
        const staleComp = requestVersion !== this.editorVersion;

        if (staleComp) {
            this.beans.context.destroyBean(cellEditor);
            return;
        }

        const editingCancelledByUserComp = cellEditor.isCancelBeforeStart && cellEditor.isCancelBeforeStart();
        if (editingCancelledByUserComp) {
            this.beans.context.destroyBean(cellEditor);
            this.cellCtrl.stopEditing(true);
            return;
        }

        if (!cellEditor.getGui) {
            console.warn(`AG Grid: cellEditor for column ${this.column.getId()} is missing getGui() method`);
            this.beans.context.destroyBean(cellEditor);
            return;
        }

        this.cellEditor = cellEditor;
        this.cellEditorGui = cellEditor.getGui();

        const cellEditorInPopup = popup || (cellEditor.isPopup !== undefined && cellEditor.isPopup());
        if (cellEditorInPopup) {
            this.addPopupCellEditor(params, position);
        } else {
            this.addInCellEditor();
        }

        this.refreshEditStyles(true, cellEditorInPopup);

        if (cellEditor.afterGuiAttached) {
            cellEditor.afterGuiAttached();
        }
    }

    private refreshEditStyles(editing: boolean, isPopup?: boolean): void {
        this.addOrRemoveCssClass('ag-cell-inline-editing', editing && !isPopup);
        this.addOrRemoveCssClass('ag-cell-popup-editing', editing && !!isPopup);
        this.addOrRemoveCssClass('ag-cell-not-inline-editing', !editing || !!isPopup);

        this.rowCtrl?.setInlineEditingCss(editing);
    }

    private addInCellEditor(): void {
        const eGui = this.getGui();

        // if focus is inside the cell, we move focus to the cell itself
        // before removing it's contents, otherwise errors could be thrown.
        const eDocument = this.beans.gridOptionsService.getDocument();
        if (eGui.contains(eDocument.activeElement)) {
            eGui.focus();
        }

        this.destroyRenderer();
        this.refreshWrapper(true);
        this.clearParentOfValue();
        if (this.cellEditorGui) {
            const eParent = this.getParentOfValue();
            eParent.appendChild(this.cellEditorGui);
        }
    }

    private addPopupCellEditor(params: ICellEditorParams, position?: 'over' | 'under'): void {
        if (this.beans.gridOptionsService.get('editType') === 'fullRow') {
            console.warn('AG Grid: popup cellEditor does not work with fullRowEdit - you cannot use them both ' +
                '- either turn off fullRowEdit, or stop using popup editors.');
        }

        const cellEditor = this.cellEditor!;

        // if a popup, then we wrap in a popup editor and return the popup
        this.cellEditorPopupWrapper = this.beans.context.createBean(new PopupEditorWrapper(params));
        const ePopupGui = this.cellEditorPopupWrapper.getGui();
        if (this.cellEditorGui) {
            ePopupGui.appendChild(this.cellEditorGui);
        }

        const popupService = this.beans.popupService;

        const useModelPopup = this.beans.gridOptionsService.get('stopEditingWhenCellsLoseFocus');

        // see if position provided by colDef, if not then check old way of method on cellComp
        const positionToUse: 'over' | 'under' | undefined = position != null 
            ? position 
            : cellEditor.getPopupPosition 
                ? cellEditor.getPopupPosition() 
                : 'over';
        const isRtl = this.beans.gridOptionsService.get('enableRtl');

        const positionParams = {
            ePopup: ePopupGui,
            column: this.column,
            rowNode: this.rowNode,
            type: 'popupCellEditor',
            eventSource: this.getGui(),
            position: positionToUse,
            alignSide: isRtl ? 'right' : 'left',
            keepWithinBounds: true
        };

        const positionCallback = popupService.positionPopupByComponent.bind(popupService, positionParams)

        const translate = this.beans.localeService.getLocaleTextFunc();

        const addPopupRes = popupService.addPopup({
            modal: useModelPopup,
            eChild: ePopupGui,
            closeOnEsc: true,
            closedCallback: () => { this.cellCtrl.onPopupEditorClosed(); },
            anchorToElement: this.getGui(),
            positionCallback,
            ariaLabel: translate('ariaLabelCellEditor', 'Cell Editor')
        });
        if (addPopupRes) {
            this.hideEditorPopup = addPopupRes.hideFunc;
        }
    }

    public detach(): void {
        this.eRow.removeChild(this.getGui());
    }

    // if the row is also getting destroyed, then we don't need to remove from dom,
    // as the row will also get removed, so no need to take out the cells from the row
    // if the row is going (removing is an expensive operation, so only need to remove
    // the top part)
    //
    // note - this is NOT called by context, as we don't wire / unwire the CellComp for performance reasons.
    public destroy(): void {
        this.cellCtrl.stopEditing();

        this.destroyEditorAndRenderer();
        this.removeControls();

        super.destroy();
    }

    private clearParentOfValue(): void {
        const eGui = this.getGui();

        // if focus is inside the cell, we move focus to the cell itself
        // before removing it's contents, otherwise errors could be thrown.
        const eDocument = this.beans.gridOptionsService.getDocument();
        if (eGui.contains(eDocument.activeElement) && browserSupportsPreventScroll()) {
            eGui.focus({ preventScroll: true });
        }

        clearElement(this.getParentOfValue());
    }
}
