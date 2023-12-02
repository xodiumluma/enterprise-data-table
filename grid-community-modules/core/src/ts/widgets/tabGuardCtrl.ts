import { BeanStub } from "../context/beanStub";
import { Autowired, PostConstruct } from "../context/context";
import { FocusService } from "../focusService";
import { ManagedFocusFeature } from "./managedFocusFeature";

export enum TabGuardClassNames {
    TAB_GUARD = 'ag-tab-guard',
    TAB_GUARD_TOP = 'ag-tab-guard-top',
    TAB_GUARD_BOTTOM = 'ag-tab-guard-bottom'
};

export interface ITabGuard {
    setTabIndex(tabIndex?: string): void;
}

export class TabGuardCtrl extends BeanStub {

    @Autowired('focusService') private readonly focusService: FocusService;

    private readonly comp: ITabGuard;
    private readonly eTopGuard: HTMLElement;
    private readonly eBottomGuard: HTMLElement;

    private readonly eFocusableElement: HTMLElement;
    private readonly focusTrapActive: boolean;

    private readonly providedFocusInnerElement?: (fromBottom: boolean) => void;
    private readonly providedFocusIn?: (event: FocusEvent) => void;
    private readonly providedFocusOut?: (event: FocusEvent) => void;

    private readonly providedShouldStopEventPropagation?: () => boolean;
    private readonly providedOnTabKeyDown?: (e: KeyboardEvent) => void;
    private readonly providedHandleKeyDown?: (e: KeyboardEvent) => void;

    private skipTabGuardFocus: boolean = false;

    constructor(params: {
        comp: ITabGuard,
        eTopGuard: HTMLElement,
        eBottomGuard: HTMLElement,
        eFocusableElement: HTMLElement,
        focusTrapActive?: boolean,
        focusInnerElement?: (fromBottom: boolean) => void,
        onFocusIn?: (event: FocusEvent) => void,
        onFocusOut?: (event: FocusEvent) => void,
        shouldStopEventPropagation?: () => boolean,
        onTabKeyDown?: (e: KeyboardEvent) => void,
        handleKeyDown?: (e: KeyboardEvent) => void
    }) {
        super();

        const {
            comp,
            eTopGuard,
            eBottomGuard,
            focusTrapActive,
            focusInnerElement,
            onFocusIn,
            onFocusOut,
            shouldStopEventPropagation,
            onTabKeyDown,
            handleKeyDown,
            eFocusableElement
        } = params;

        this.comp = comp;

        this.eTopGuard = eTopGuard;
        this.eBottomGuard = eBottomGuard;
        this.providedFocusInnerElement = focusInnerElement;
        this.eFocusableElement = eFocusableElement;
        this.focusTrapActive = !!focusTrapActive;

        this.providedFocusIn = onFocusIn;
        this.providedFocusOut = onFocusOut;
        this.providedShouldStopEventPropagation = shouldStopEventPropagation;
        this.providedOnTabKeyDown = onTabKeyDown;
        this.providedHandleKeyDown = handleKeyDown;
    }

    @PostConstruct
    private postConstruct() {
        this.createManagedBean(new ManagedFocusFeature(
            this.eFocusableElement,
            {
                shouldStopEventPropagation: () => this.shouldStopEventPropagation(),
                onTabKeyDown: e => this.onTabKeyDown(e),
                handleKeyDown: e => this.handleKeyDown(e),
                onFocusIn: e => this.onFocusIn(e),
                onFocusOut: e => this.onFocusOut(e)
            }
        ));

        this.activateTabGuards();

        [this.eTopGuard, this.eBottomGuard].forEach(
            guard => this.addManagedListener(guard, 'focus', this.onFocus.bind(this))
        );
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (this.providedHandleKeyDown) {
            this.providedHandleKeyDown(e);
        }
    }

    private tabGuardsAreActive(): boolean {
        return !!this.eTopGuard && this.eTopGuard.hasAttribute('tabIndex');
    }

    private shouldStopEventPropagation(): boolean {
        if (this.providedShouldStopEventPropagation) {
            return this.providedShouldStopEventPropagation();
        }
        return false;
    }

    private activateTabGuards(): void {
        const tabIndex = this.gridOptionsService.get('tabIndex');
        this.comp.setTabIndex(tabIndex.toString());
    }

    private deactivateTabGuards(): void {
        this.comp.setTabIndex();
    }

    private onFocus(e: FocusEvent): void {
        if (this.skipTabGuardFocus) {
            this.skipTabGuardFocus = false;
            return;
        }

        const fromBottom = e.target === this.eBottomGuard;

        if (this.providedFocusInnerElement) {
            this.providedFocusInnerElement(fromBottom);
        } else {
            this.focusInnerElement(fromBottom);
        }
    }

    private onFocusIn(e: FocusEvent): void {
        if (this.focusTrapActive) { return; }

        if (this.providedFocusIn) {
            this.providedFocusIn(e);
        }

        this.deactivateTabGuards();
    }

    private onFocusOut(e: FocusEvent): void {
        if (this.focusTrapActive) { return; }

        if (this.providedFocusOut) {
            this.providedFocusOut(e);
        }

        if (!this.eFocusableElement.contains(e.relatedTarget as HTMLElement)) {
            this.activateTabGuards();
        }
    }

    public onTabKeyDown(e: KeyboardEvent): void {
        if (this.providedOnTabKeyDown) {
            this.providedOnTabKeyDown(e);
            return;
        }

        if (this.focusTrapActive) { return; }
        if (e.defaultPrevented) { return; }

        const tabGuardsAreActive = this.tabGuardsAreActive();

        if (tabGuardsAreActive) {
            this.deactivateTabGuards();
        }

        const nextRoot = this.getNextFocusableElement(e.shiftKey);

        if (tabGuardsAreActive) {
            // ensure the tab guards are only re-instated once the event has finished processing, to avoid the browser
            // tabbing to the tab guard from inside the component
            setTimeout(() => this.activateTabGuards(), 0);
        }

        if (!nextRoot) { return; }

        nextRoot.focus();
        e.preventDefault();
    }

    public focusInnerElement(fromBottom = false): void {
        const focusable = this.focusService.findFocusableElements(this.eFocusableElement);

        if (this.tabGuardsAreActive()) {
            // remove tab guards from this component from list of focusable elements
            focusable.splice(0, 1);
            focusable.splice(focusable.length - 1, 1);
        }

        if (!focusable.length) { return; }

        focusable[fromBottom ? focusable.length - 1 : 0].focus({ preventScroll: true });
    }

    public getNextFocusableElement(backwards?: boolean): HTMLElement | null {
        return this.focusService.findNextFocusableElement(this.eFocusableElement, false, backwards);
    }

    public forceFocusOutOfContainer(up: boolean = false): void {
        const tabGuardToFocus = up ? this.eTopGuard : this.eBottomGuard;

        this.activateTabGuards();
        this.skipTabGuardFocus = true;

        tabGuardToFocus.focus();

        window.setTimeout(() => {
            this.activateTabGuards();
        });
    }

}