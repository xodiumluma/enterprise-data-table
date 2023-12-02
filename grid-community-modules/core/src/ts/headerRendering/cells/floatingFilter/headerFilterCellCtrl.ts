import { HeaderRowCtrl } from "../../row/headerRowCtrl";
import { AbstractHeaderCellCtrl, IAbstractHeaderCellComp } from "../abstractCell/abstractHeaderCellCtrl";
import { KeyCode } from '../../../constants/keyCode';
import { Autowired } from '../../../context/context';
import { Column } from '../../../entities/column';
import { Events, FilterChangedEvent } from '../../../events';
import { FilterManager } from '../../../filter/filterManager';
import { IFloatingFilter } from '../../../filter/floating/floatingFilter';
import { IMenuFactory } from '../../../interfaces/iMenuFactory';
import { ColumnHoverService } from '../../../rendering/columnHoverService';
import { SetLeftFeature } from '../../../rendering/features/setLeftFeature';
import { AgPromise } from '../../../utils';
import { isElementChildOfClass } from '../../../utils/dom';
import { createIconNoSpan } from '../../../utils/icon';
import { ManagedFocusFeature } from '../../../widgets/managedFocusFeature';
import { HoverFeature } from '../hoverFeature';
import { UserCompDetails } from "../../../components/framework/userComponentFactory";
import { setAriaLabel } from "../../../utils/aria";

export interface IHeaderFilterCellComp extends IAbstractHeaderCellComp {
    addOrRemoveBodyCssClass(cssClassName: string, on: boolean): void;
    setButtonWrapperDisplayed(displayed: boolean): void;
    setCompDetails(compDetails?: UserCompDetails | null): void;
    getFloatingFilterComp(): AgPromise<IFloatingFilter> | null;
    setWidth(width: string): void;
    setMenuIcon(icon: HTMLElement): void;
}

export class HeaderFilterCellCtrl extends AbstractHeaderCellCtrl<IHeaderFilterCellComp, Column> {

    @Autowired('filterManager') private readonly filterManager: FilterManager;
    @Autowired('columnHoverService') private readonly columnHoverService: ColumnHoverService;
    @Autowired('menuFactory') private readonly menuFactory: IMenuFactory;

    private eButtonShowMainFilter: HTMLElement;
    private eFloatingFilterBody: HTMLElement;

    private suppressFilterButton: boolean;
    private active: boolean;
    private iconCreated: boolean = false;

    private userCompDetails?: UserCompDetails | null;
    private destroySyncListener: (() => null) | undefined;
    private destroyFilterChangedListener: (() => null) | undefined;

    constructor(column: Column, parentRowCtrl: HeaderRowCtrl) {
        super(column, parentRowCtrl);
        this.column = column;
    }

    public setComp(comp: IHeaderFilterCellComp, eGui: HTMLElement, eButtonShowMainFilter: HTMLElement, eFloatingFilterBody: HTMLElement): void {
        this.comp = comp;
        this.eButtonShowMainFilter = eButtonShowMainFilter;
        this.eFloatingFilterBody = eFloatingFilterBody;

        this.setGui(eGui);
        this.setupActive();

        this.setupWidth();
        this.setupLeft();
        this.setupHover();
        this.setupFocus();
        this.setupAria();
        this.setupFilterButton();
        this.setupUserComp();
        this.setupSyncWithFilter();
        this.setupUi();

        this.addManagedListener(this.eButtonShowMainFilter, 'click', this.showParentFilter.bind(this));
        this.setupFilterChangedListener();
        this.addManagedListener(this.column, Column.EVENT_COL_DEF_CHANGED, this.onColDefChanged.bind(this));
    }

    // empty abstract method
    protected resizeHeader(): void {}
    // empty abstract method
    protected moveHeader(): void {}

    private setupActive(): void {
        const colDef = this.column.getColDef();
        const filterExists = !!colDef.filter;
        const floatingFilterExists = !!colDef.floatingFilter;
        this.active = filterExists && floatingFilterExists;
    }

    private setupUi(): void {
        this.comp.setButtonWrapperDisplayed(!this.suppressFilterButton && this.active);
        
        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-full-body', this.suppressFilterButton);
        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-body', !this.suppressFilterButton);
        
        if (!this.active || this.iconCreated) { return; }

        const eMenuIcon = createIconNoSpan('filter', this.gridOptionsService, this.column);

        if (eMenuIcon) {
            this.iconCreated = true;
            this.eButtonShowMainFilter.appendChild(eMenuIcon);
        }
    }

    private setupFocus(): void {
        this.createManagedBean(new ManagedFocusFeature(
            this.eGui,
            {
                shouldStopEventPropagation: this.shouldStopEventPropagation.bind(this),
                onTabKeyDown: this.onTabKeyDown.bind(this),
                handleKeyDown: this.handleKeyDown.bind(this),
                onFocusIn: this.onFocusIn.bind(this)
            }
        ));
    }

    private setupAria(): void {
        const localeTextFunc = this.localeService.getLocaleTextFunc();
        setAriaLabel(this.eButtonShowMainFilter, localeTextFunc('ariaFilterMenuOpen', 'Open Filter Menu'));
    }

    private onTabKeyDown(e: KeyboardEvent) {
        const eDocument = this.gridOptionsService.getDocument();
        const activeEl = eDocument.activeElement as HTMLElement;
        const wrapperHasFocus = activeEl === this.eGui;

        if (wrapperHasFocus) { return; }

        const nextFocusableEl = this.focusService.findNextFocusableElement(this.eGui, null, e.shiftKey);

        if (nextFocusableEl) {
            this.beans.headerNavigationService.scrollToColumn(this.column);
            e.preventDefault();
            nextFocusableEl.focus();
            return;
        }

        const nextFocusableColumn = this.findNextColumnWithFloatingFilter(e.shiftKey);

        if (!nextFocusableColumn) { return; }

        if (this.focusService.focusHeaderPosition({
            headerPosition: {
                headerRowIndex: this.getParentRowCtrl().getRowIndex(),
                column: nextFocusableColumn
            },
            event: e
        })) {
            e.preventDefault();
        }
    }

    private findNextColumnWithFloatingFilter(backwards: boolean): Column | null {
        const columnModel = this.beans.columnModel;
        let nextCol: Column | null = this.column;

        do {
            nextCol = backwards
                ? columnModel.getDisplayedColBefore(nextCol)
                : columnModel.getDisplayedColAfter(nextCol);

            if (!nextCol) { break; }

        } while (!nextCol.getColDef().filter || !nextCol.getColDef().floatingFilter);

        return nextCol;
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        const wrapperHasFocus = this.getWrapperHasFocus();

        switch (e.key) {
            case KeyCode.UP:
            case KeyCode.DOWN:
                if (!wrapperHasFocus) {
                    e.preventDefault();
                }
            case KeyCode.LEFT:
            case KeyCode.RIGHT:
                if (wrapperHasFocus) { return; }
                e.stopPropagation();
            case KeyCode.ENTER:
                if (wrapperHasFocus) {
                    if (this.focusService.focusInto(this.eGui)) {
                        e.preventDefault();
                    }
                }
                break;
            case KeyCode.ESCAPE:
                if (!wrapperHasFocus) {
                    this.eGui.focus();
                }
        }
    }

    private onFocusIn(e: FocusEvent): void {
        const isRelatedWithin = this.eGui.contains(e.relatedTarget as HTMLElement);

        // when the focus is already within the component,
        // we default to the browser's behavior
        if (isRelatedWithin) { return; }

        const notFromHeaderWrapper = !!e.relatedTarget && !(e.relatedTarget as HTMLElement).classList.contains('ag-floating-filter');
        const fromWithinHeader = !!e.relatedTarget && isElementChildOfClass(e.relatedTarget as HTMLElement, 'ag-floating-filter');

        if (notFromHeaderWrapper && fromWithinHeader && e.target === this.eGui) {
            const lastFocusEvent = this.lastFocusEvent;
            const fromTab = !!(lastFocusEvent && lastFocusEvent.key === KeyCode.TAB);

            if (lastFocusEvent && fromTab) {
                const shouldFocusLast = lastFocusEvent.shiftKey;

                this.focusService.focusInto(this.eGui, shouldFocusLast);
            }
        }

        const rowIndex = this.getRowIndex();
        this.beans.focusService.setFocusedHeader(rowIndex, this.column);
    }

    private setupHover(): void {
        this.createManagedBean(new HoverFeature([this.column], this.eGui));

        const listener = () => {
            if (!this.gridOptionsService.get('columnHoverHighlight')) { return; }
            const hovered = this.columnHoverService.isHovered(this.column);
            this.comp.addOrRemoveCssClass('ag-column-hover', hovered);
        };

        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_HOVER_CHANGED, listener);
        listener();
    }

    private setupLeft(): void {
        const setLeftFeature = new SetLeftFeature(this.column, this.eGui, this.beans);
        this.createManagedBean(setLeftFeature);
    }

    private setupFilterButton(): void {
        const colDef = this.column.getColDef();
        // this is unusual - we need a params value OUTSIDE the component the params are for.
        // the params are for the floating filter component, but this property is actually for the wrapper.
        this.suppressFilterButton = colDef.floatingFilterComponentParams ? !!colDef.floatingFilterComponentParams.suppressFilterButton : false;
    }

    private setupUserComp(): void {
        if (!this.active) { return; }

        const compDetails = this.filterManager.getFloatingFilterCompDetails(
            this.column,
            () => this.showParentFilter()
        );

        if (compDetails) {
            this.setCompDetails(compDetails);
        }
    }

    private setCompDetails(compDetails?: UserCompDetails | null): void {
        this.userCompDetails = compDetails;
        this.comp.setCompDetails(compDetails);
    }

    private showParentFilter() {
        const eventSource = this.suppressFilterButton ? this.eFloatingFilterBody : this.eButtonShowMainFilter;
        this.menuFactory.showMenuAfterButtonClick(this.column, eventSource, 'floatingFilter', 'filterMenuTab', ['filterMenuTab']);
    }

    private setupSyncWithFilter(): void {
        if (!this.active) { return; }

        const syncWithFilter = (filterChangedEvent: FilterChangedEvent | null) => {
            const compPromise = this.comp.getFloatingFilterComp();

            if (!compPromise) { return; }

            compPromise.then(comp => {
                if (comp) {
                    const parentModel = this.filterManager.getCurrentFloatingFilterParentModel(this.column);
                    comp.onParentModelChanged(parentModel, filterChangedEvent);
                }
            });
        };

        this.destroySyncListener = this.addManagedListener(this.column, Column.EVENT_FILTER_CHANGED, syncWithFilter);

        if (this.filterManager.isFilterActive(this.column)) {
            syncWithFilter(null);
        }
    }

    private setupWidth(): void {
        const listener = () => {
            const width = `${this.column.getActualWidth()}px`;
            this.comp.setWidth(width);
        };

        this.addManagedListener(this.column, Column.EVENT_WIDTH_CHANGED, listener);
        listener();
    }

    private setupFilterChangedListener(): void {
        if (this.active) {
            this.destroyFilterChangedListener = this.addManagedListener(this.column, Column.EVENT_FILTER_CHANGED, this.updateFilterButton.bind(this));
        }
    }

    private updateFilterButton(): void {
        if (!this.suppressFilterButton && this.comp) {
            this.comp.setButtonWrapperDisplayed(this.filterManager.isFilterAllowed(this.column));
        }
    }

    private onColDefChanged(): void {
        const wasActive = this.active;
        this.setupActive();
        const becomeActive = !wasActive && this.active;
        if (wasActive && !this.active) {
            this.destroySyncListener?.();
            this.destroyFilterChangedListener?.();
        }

        const newCompDetails = this.active
            ? this.filterManager.getFloatingFilterCompDetails(
                this.column,
                () => this.showParentFilter()
            )
            : null;

        const compPromise = this.comp.getFloatingFilterComp();
        if (!compPromise || !newCompDetails) {
            this.updateCompDetails(newCompDetails, becomeActive);
        } else {
            compPromise.then(compInstance => {
                if (!compInstance || this.filterManager.areFilterCompsDifferent(this.userCompDetails ?? null, newCompDetails)) {
                    this.updateCompDetails(newCompDetails, becomeActive);
                } else {
                    this.updateFloatingFilterParams(newCompDetails);
                }
            });
        }
    }

    private updateCompDetails(compDetails: UserCompDetails | null | undefined, becomeActive: boolean): void {
        this.setCompDetails(compDetails);
        // filter button and UI can change based on params, so always want to update
        this.setupFilterButton();
        this.setupUi();
        if (becomeActive) {
            this.setupSyncWithFilter();
            this.setupFilterChangedListener();
        }
    }

    private updateFloatingFilterParams(userCompDetails?: UserCompDetails | null): void {
        if (!userCompDetails) { return; }

        const params = userCompDetails.params;

        this.comp.getFloatingFilterComp()?.then(floatingFilter => {
            if (floatingFilter?.onParamsUpdated && typeof floatingFilter.onParamsUpdated === 'function') {
                floatingFilter.onParamsUpdated(params)
            }
        })
    }

    protected destroy(): void {
        super.destroy();

        (this.eButtonShowMainFilter as any) = null;
        (this.eFloatingFilterBody as any) = null;
        (this.userCompDetails as any) = null;
        (this.destroySyncListener as any) = null;
        (this.destroyFilterChangedListener as any) = null;
    }
}
