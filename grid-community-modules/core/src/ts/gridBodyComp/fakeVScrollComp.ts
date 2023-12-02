import { PostConstruct } from "../context/context";
import { AbstractFakeScrollComp } from "./abstractFakeScrollComp";
import { isVisible, setFixedWidth } from "../utils/dom";
import { SetHeightFeature } from "./rowContainer/setHeightFeature";
import { Events } from "../eventKeys";

export class FakeVScrollComp extends AbstractFakeScrollComp {

    private static TEMPLATE = /* html */
        `<div class="ag-body-vertical-scroll" aria-hidden="true">
            <div class="ag-body-vertical-scroll-viewport" ref="eViewport">
                <div class="ag-body-vertical-scroll-container" ref="eContainer"></div>
            </div>
        </div>`;

    constructor() {
        super(FakeVScrollComp.TEMPLATE, 'vertical');
    }

    @PostConstruct
    protected postConstruct(): void {
        super.postConstruct();

        this.createManagedBean(new SetHeightFeature(this.eContainer));
        this.ctrlsService.registerFakeVScrollComp(this);

        this.addManagedListener(this.eventService, Events.EVENT_ROW_CONTAINER_HEIGHT_CHANGED, this.onRowContainerHeightChanged.bind(this));
    }

    protected setScrollVisible(): void {
        const vScrollShowing = this.scrollVisibleService.isVerticalScrollShowing();
        const invisibleScrollbar = this.invisibleScrollbar;

        const scrollbarWidth = vScrollShowing ? (this.gridOptionsService.getScrollbarWidth() || 0) : 0;
        const adjustedScrollbarWidth = (scrollbarWidth === 0 && invisibleScrollbar) ? 16 : scrollbarWidth;

        this.addOrRemoveCssClass('ag-scrollbar-invisible', invisibleScrollbar);
        setFixedWidth(this.getGui(), adjustedScrollbarWidth);
        setFixedWidth(this.eViewport, adjustedScrollbarWidth);
        setFixedWidth(this.eContainer, adjustedScrollbarWidth);
        this.setDisplayed(vScrollShowing, { skipAriaHidden: true });
    }

    private onRowContainerHeightChanged(): void {
        const gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
        const gridBodyViewportEl = gridBodyCtrl.getBodyViewportElement();

        if (this.eViewport.scrollTop != gridBodyViewportEl.scrollTop) {
            this.eViewport.scrollTop = gridBodyViewportEl.scrollTop;
        }
    }

    public getScrollPosition(): number {
        return this.getViewport().scrollTop;
    }

    public setScrollPosition(value: number): void {
        if (!isVisible(this.getViewport())) { this.attemptSettingScrollPosition(value); }
        this.getViewport().scrollTop = value;
    }
}