import { AgPromise } from '../utils';
import { RefSelector } from '../widgets/componentAnnotations';
import { IAfterGuiAttachedParams } from '../interfaces/iAfterGuiAttachedParams';
import { clearElement } from '../utils/dom';
import { setAriaLabel, setAriaRole } from '../utils/aria';
import { callIfPresent } from '../utils/function';
import { KeyCode } from '../constants/keyCode';
import { PostConstruct, Autowired } from '../context/context';
import { FocusService } from '../focusService';
import { TabGuardComp } from '../widgets/tabGuardComp';
import { formatNumberTwoDecimalPlacesAndCommas } from '../utils/number';

export class TabbedLayout extends TabGuardComp {

    @Autowired('focusService') private focusService: FocusService;

    @RefSelector('eHeader') private readonly eHeader: HTMLElement;
    @RefSelector('eBody') private readonly eBody: HTMLElement;

    private params: TabbedLayoutParams;
    private afterAttachedParams: IAfterGuiAttachedParams;
    private items: TabbedItemWrapper[] = [];
    private activeItem: TabbedItemWrapper;
    private lastScrollListener: (() => null) | null | undefined;
    private readonly tabbedItemScrollMap = new Map<string, number>();

    constructor(params: TabbedLayoutParams) {
        super(TabbedLayout.getTemplate(params.cssClass));
        this.params = params;

        if (params.items) {
            params.items.forEach(item => this.addItem(item));
        }
    }

    @PostConstruct
    private postConstruct() {

        this.initialiseTabGuard({
            onTabKeyDown: this.onTabKeyDown.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this),
            focusInnerElement: this.focusInnerElement.bind(this),
            focusTrapActive: true
        });

        this.addDestroyFunc(() => this.activeItem?.tabbedItem?.afterDetachedCallback?.());
    }

    private static getTemplate(cssClass?: string) {
        return /* html */ `<div class="ag-tabs ${cssClass}">
            <div ref="eHeader" role="tablist" class="ag-tabs-header ${cssClass ? `${cssClass}-header` : ''}"></div>
            <div ref="eBody" role="presentation" class="ag-tabs-body ${cssClass ? `${cssClass}-body` : ''}"></div>
        </div>`;
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        const eDocument = this.gridOptionsService.getDocument();
        switch (e.key) {
            case KeyCode.RIGHT:
            case KeyCode.LEFT:
                if (!this.eHeader.contains(eDocument.activeElement)) { return; }
                const isRightKey = e.key === KeyCode.RIGHT;
                const isRtl = this.gridOptionsService.get('enableRtl');
                const currentPosition = this.items.indexOf(this.activeItem);
                const nextPosition = isRightKey !== isRtl ? Math.min(currentPosition + 1, this.items.length - 1) : Math.max(currentPosition - 1, 0);

                if (currentPosition === nextPosition) { return; }

                e.preventDefault();

                const nextItem = this.items[nextPosition];

                this.showItemWrapper(nextItem);
                nextItem.eHeaderButton.focus();
                break;
            case KeyCode.UP:
            case KeyCode.DOWN:
                e.stopPropagation();
                break;
        }
    }

    protected onTabKeyDown(e: KeyboardEvent) {
        if (e.defaultPrevented) { return; }

        const { focusService, eHeader, eBody, activeItem } = this;
        const eDocument = this.gridOptionsService.getDocument();
        const activeElement = eDocument.activeElement as HTMLElement;
        const target = e.target as HTMLElement;

        e.preventDefault();

        if (eHeader.contains(activeElement)) {
            // focus is in header, move into body of popup
            this.focusBody(e.shiftKey);
            return;
        }

        let nextEl: HTMLElement | null = null;

        if (focusService.isTargetUnderManagedComponent(eBody, target)) {
            if (e.shiftKey) {
                nextEl = this.focusService.findFocusableElementBeforeTabGuard(eBody, target);
            }

            if (!nextEl) {
                nextEl = activeItem.eHeaderButton;
            }
        }

        if (!nextEl && eBody.contains(activeElement)) {
            nextEl = focusService.findNextFocusableElement(eBody, false, e.shiftKey);

            if (!nextEl) {
                this.focusHeader();
            }
        }

        if (nextEl) {
            nextEl.focus();
        }
    }

    private focusInnerElement(fromBottom?: boolean): void {
        if (fromBottom) {
            this.focusHeader();
        } else {
            this.focusBody(true);
        }
    }

    private focusHeader(): void {
        this.activeItem.eHeaderButton.focus();
    }

    private focusBody(fromBottom?: boolean): void {
        this.focusService.focusInto(this.eBody, fromBottom);
    }

    public setAfterAttachedParams(params: IAfterGuiAttachedParams): void {
        this.afterAttachedParams = params;
    }

    public showFirstItem(): void {
        if (this.items.length > 0) {
            this.showItemWrapper(this.items[0]);
        }
    }

    private addItem(item: TabbedItem): void {
        const eHeaderButton = document.createElement('span');

        setAriaRole(eHeaderButton, 'tab');
        eHeaderButton.setAttribute('tabindex', '-1');
        eHeaderButton.appendChild(item.title);
        eHeaderButton.classList.add('ag-tab');

        this.eHeader.appendChild(eHeaderButton);
        setAriaLabel(eHeaderButton, item.titleLabel);

        const wrapper: TabbedItemWrapper = {
            tabbedItem: item,
            eHeaderButton: eHeaderButton
        };
        this.items.push(wrapper);

        eHeaderButton.addEventListener('click', this.showItemWrapper.bind(this, wrapper));
    }

    public showItem(tabbedItem: TabbedItem): void {
        const itemWrapper = this.items.find(wrapper => wrapper.tabbedItem === tabbedItem);

        if (itemWrapper) {
            this.showItemWrapper(itemWrapper);
        }
    }

    private showItemWrapper(wrapper: TabbedItemWrapper): void {
        const { tabbedItem, eHeaderButton } = wrapper;

        if (this.params.onItemClicked) {
            this.params.onItemClicked({ item: tabbedItem });
        }

        if (this.activeItem === wrapper) {
            callIfPresent(this.params.onActiveItemClicked!);
            return;
        }

        if (this.lastScrollListener) {
            this.lastScrollListener = this.lastScrollListener();
        }

        clearElement(this.eBody);

        tabbedItem.bodyPromise.then((body: HTMLElement) => {
            this.eBody.appendChild(body);
            const onlyUnmanaged = !this.focusService.isKeyboardMode();

            this.focusService.focusInto(this.eBody, false, onlyUnmanaged);

            if (tabbedItem.afterAttachedCallback) {
                tabbedItem.afterAttachedCallback(this.afterAttachedParams);
            }

            if (this.params.keepScrollPosition) {
                const scrollableContainer = (tabbedItem.getScrollableContainer && tabbedItem.getScrollableContainer()) || body;
                this.lastScrollListener = this.addManagedListener(scrollableContainer, 'scroll', () => {
                    this.tabbedItemScrollMap.set(tabbedItem.name, scrollableContainer.scrollTop);
                });
                const scrollPosition = this.tabbedItemScrollMap.get(tabbedItem.name);
                if (scrollPosition !== undefined) {
                    // Safari needs a small timeout or it will fire a scroll event to position 0
                    setTimeout(() => {
                        scrollableContainer.scrollTop = scrollPosition;
                    }, 0);
                }
            }
        });

        if (this.activeItem) {
            this.activeItem.eHeaderButton.classList.remove('ag-tab-selected');
            this.activeItem.tabbedItem.afterDetachedCallback?.();
        }

        eHeaderButton.classList.add('ag-tab-selected');

        this.activeItem = wrapper;
    }
}

export interface TabbedLayoutParams {
    items: TabbedItem[];
    cssClass?: string;
    keepScrollPosition?: boolean;
    onItemClicked?: Function;
    onActiveItemClicked?: Function;
}

export interface TabbedItem {
    title: Element;
    titleLabel: string;
    bodyPromise: AgPromise<HTMLElement>;
    name: string;
    getScrollableContainer?: () => HTMLElement;
    afterAttachedCallback?: (params: IAfterGuiAttachedParams) => void;
    afterDetachedCallback?: () => void;
}

interface TabbedItemWrapper {
    tabbedItem: TabbedItem;
    eHeaderButton: HTMLElement;
}
