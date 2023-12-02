import { Component, PostConstruct, RefSelector, ManagedFocusFeature, _ } from "@ag-grid-community/core";
import { AgColorPicker } from "./agColorPicker";
import { _Util } from 'ag-charts-community';
import { KeyCode } from "@ag-grid-community/core";

export class AgColorPanel extends Component {
    private H = 1; // in the [0, 1] range
    private S = 1; // in the [0, 1] range
    private B = 1; // in the [0, 1] range
    private A = 1; // in the [0, 1] range

    private spectrumValRect?: ClientRect | DOMRect;
    private isSpectrumDragging = false;

    private spectrumHueRect?: ClientRect | DOMRect;
    private isSpectrumHueDragging = false;

    private spectrumAlphaRect?: ClientRect | DOMRect;
    private isSpectrumAlphaDragging = false;

    private picker: Component;

    private colorChanged = false;
    private static maxRecentColors = 8;
    private static recentColors: string[] = [];
    private tabIndex: string;

    private static TEMPLATE = /* html */
        `<div class="ag-color-panel" tabindex="-1">
            <div ref="spectrumColor" class="ag-spectrum-color">
                <div class="ag-spectrum-sat ag-spectrum-fill">
                    <div ref="spectrumVal" class="ag-spectrum-val ag-spectrum-fill">
                        <div ref="spectrumDragger" class="ag-spectrum-dragger"></div>
                    </div>
                </div>
            </div>
            <div class="ag-spectrum-tools">
                <div ref="spectrumHue" class="ag-spectrum-hue ag-spectrum-tool">
                    <div class="ag-spectrum-hue-background"></div>
                    <div ref="spectrumHueSlider" class="ag-spectrum-slider"></div>
                </div>
                <div ref="spectrumAlpha" class="ag-spectrum-alpha ag-spectrum-tool">
                    <div class="ag-spectrum-alpha-background"></div>
                    <div ref="spectrumAlphaSlider" class="ag-spectrum-slider"></div>
                </div>
                <div ref="recentColors" class="ag-recent-colors"></div>
            </div>
        </div>`;

    @RefSelector('spectrumColor') private readonly spectrumColor: HTMLElement;
    @RefSelector('spectrumVal') private readonly spectrumVal: HTMLElement;
    @RefSelector('spectrumDragger') private readonly spectrumDragger: HTMLElement;
    @RefSelector('spectrumHue') private readonly spectrumHue: HTMLElement;
    @RefSelector('spectrumHueSlider') private readonly spectrumHueSlider: HTMLElement;
    @RefSelector('spectrumAlpha') private readonly spectrumAlpha: HTMLElement;
    @RefSelector('spectrumAlphaSlider') private readonly spectrumAlphaSlider: HTMLElement;
    @RefSelector('recentColors') private readonly recentColors: HTMLElement;

    constructor(config: { picker: Component }) {
        super(AgColorPanel.TEMPLATE);
        this.picker = config.picker;
    }

    @PostConstruct
    private postConstruct() {
        this.initTabIndex();
        this.initRecentColors();

        this.addGuiEventListener('focus', () => this.spectrumColor.focus());
        this.addGuiEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === KeyCode.ENTER && !e.defaultPrevented) {
                this.destroy();
            }
        });

        this.addManagedListener(this.spectrumColor, 'keydown', e => this.moveDragger(e));
        this.addManagedListener(this.spectrumAlphaSlider, 'keydown', e => this.moveAlphaSlider(e));
        this.addManagedListener(this.spectrumHueSlider, 'keydown', e => this.moveHueSlider(e));

        this.addManagedListener(this.spectrumVal, 'mousedown', this.onSpectrumDraggerDown.bind(this));
        this.addManagedListener(this.spectrumHue, 'mousedown', this.onSpectrumHueDown.bind(this));
        this.addManagedListener(this.spectrumAlpha, 'mousedown', this.onSpectrumAlphaDown.bind(this));

        this.addGuiEventListener('mousemove', (e: MouseEvent) => {
            this.onSpectrumDraggerMove(e);
            this.onSpectrumHueMove(e);
            this.onSpectrumAlphaMove(e);
        });

        // Listening to `mouseup` on the document on purpose. The user might release the mouse button
        // outside the UI control. When the mouse returns back to the control's area, the dragging
        // of the thumb is not expected and seen as a bug.
        this.addManagedListener(document, 'mouseup', this.onMouseUp.bind(this));

        this.addManagedListener(this.recentColors, 'click', this.onRecentColorClick.bind(this));
        this.addManagedListener(this.recentColors, 'keydown', (e: KeyboardEvent) => {
            if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
                e.preventDefault();
                this.onRecentColorClick(e);
            }
        })
    }

    private initTabIndex(): void {
        const tabIndex = this.tabIndex = (this.gridOptionsService.get('tabIndex')).toString();

        this.spectrumColor.setAttribute('tabindex', tabIndex);
        this.spectrumHueSlider.setAttribute('tabindex', tabIndex);
        this.spectrumAlphaSlider.setAttribute('tabindex', tabIndex);
    }

    private refreshSpectrumRect() {
        return this.spectrumValRect = this.spectrumVal.getBoundingClientRect();
    }

    private refreshHueRect() {
        return this.spectrumHueRect = this.spectrumHue.getBoundingClientRect();
    }

    private refreshAlphaRect() {
        return this.spectrumAlphaRect = this.spectrumAlpha.getBoundingClientRect();
    }

    private onSpectrumDraggerDown(e: MouseEvent) {
        this.refreshSpectrumRect();
        this.isSpectrumDragging = true;

        this.moveDragger(e);
    }

    private onSpectrumDraggerMove(e: MouseEvent) {
        if (this.isSpectrumDragging) {
            this.moveDragger(e);
        }
    }

    private onSpectrumHueDown(e: MouseEvent) {
        this.refreshHueRect();
        this.isSpectrumHueDragging = true;

        this.moveHueSlider(e);
    }

    private onSpectrumHueMove(e: MouseEvent) {
        if (this.isSpectrumHueDragging) {
            this.moveHueSlider(e);
        }
    }

    private onSpectrumAlphaDown(e: MouseEvent) {
        this.refreshAlphaRect();
        this.isSpectrumAlphaDragging = true;

        this.moveAlphaSlider(e);
    }

    private onSpectrumAlphaMove(e: MouseEvent) {
        if (this.isSpectrumAlphaDragging) {
            this.moveAlphaSlider(e);
        }
    }

    private onMouseUp() {
        this.isSpectrumDragging = false;
        this.isSpectrumHueDragging = false;
        this.isSpectrumAlphaDragging = false;
    }

    private moveDragger(e: MouseEvent | KeyboardEvent) {
        const valRect = this.spectrumValRect;
        if (!valRect) { return; }

        let x: number;
        let y: number;

        if (e instanceof MouseEvent) {
            x = e.clientX - valRect.left;
            y = e.clientY - valRect.top;
        } else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            const isUp = e.key === KeyCode.UP;
            const isDown = e.key === KeyCode.DOWN;
            const isVertical = isUp || isDown;
            const isHorizontal = isLeft || isRight;

            if (!isVertical && !isHorizontal) { return; }
            e.preventDefault();

            const { x: currentX, y: currentY } = this.getSpectrumValue();
            x = currentX + (isHorizontal ? (isLeft ? -5 : 5) : 0);
            y = currentY + (isVertical ? (isUp ? -5 : 5) : 0);
        }

        x = Math.max(x, 0);
        x = Math.min(x, valRect.width);
        y = Math.max(y, 0);
        y = Math.min(y, valRect.height);

        this.setSpectrumValue(x / valRect.width, 1 - y / valRect.height);
    }

    private moveHueSlider(e: MouseEvent | KeyboardEvent) {
        const rect = this.spectrumHueRect;

        if (!rect) { return; }

        const x = this.moveSlider(this.spectrumHueSlider, e);

        if (x == null) { return; }

        this.H = 1 - x / rect.width;
        this.update();
    }

    private moveAlphaSlider(e: MouseEvent | KeyboardEvent) {
        const rect = this.spectrumAlphaRect;

        if (!rect) { return; }

        const x = this.moveSlider(this.spectrumAlphaSlider, e);

        if (x == null) { return; }

        this.A = x / rect.width;
        this.update();
    }

    private moveSlider(slider: HTMLElement, e: MouseEvent | KeyboardEvent): number | null {
        const sliderRect = slider.getBoundingClientRect();
        const parentRect = slider.parentElement?.getBoundingClientRect();

        if (!slider || !parentRect) { return null; }


        let x: number;
        if (e instanceof MouseEvent) {
            x = e.clientX - parentRect.left;
        } else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            if (!isLeft && !isRight) { return null; }
            e.preventDefault();
            const diff = isLeft ? -5 : 5;
            x = (parseFloat(slider.style.left) - sliderRect.width / 2) + diff;
        }

        x = Math.max(x, 0);
        x = Math.min(x, parentRect.width);

        slider.style.left = (x + sliderRect.width / 2) + 'px';

        return x;
    }

    private update() {
        const color = _Util.Color.fromHSB(this.H * 360, this.S, this.B, this.A);
        const spectrumColor = _Util.Color.fromHSB(this.H * 360, 1, 1);
        const rgbaColor = color.toRgbaString();

        // the recent color list needs to know color has actually changed
        const colorPicker = this.picker as AgColorPicker;

        const existingColor = _Util.Color.fromString(colorPicker.getValue());
        if (existingColor.toRgbaString() !== rgbaColor) {
            this.colorChanged = true;
        }

        colorPicker.setValue(rgbaColor);

        this.spectrumColor.style.backgroundColor = spectrumColor.toRgbaString();
        this.spectrumDragger.style.backgroundColor = rgbaColor;
    }

    /**
     * @param saturation In the [0, 1] interval.
     * @param brightness In the [0, 1] interval.
     */
    public setSpectrumValue(saturation: number, brightness: number) {
        const valRect = this.spectrumValRect || this.refreshSpectrumRect();

        if (valRect == null) { return; }

        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();

        saturation = Math.max(0, saturation);
        saturation = Math.min(1, saturation);
        brightness = Math.max(0, brightness);
        brightness = Math.min(1, brightness);

        this.S = saturation;
        this.B = brightness;

        dragger.style.left = (saturation * valRect.width - draggerRect.width / 2) + 'px';
        dragger.style.top = ((1 - brightness) * valRect.height - draggerRect.height / 2) + 'px';

        this.update();
    }

    private getSpectrumValue(): { x: number, y: number } {
        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();

        const x = parseFloat(dragger.style.left) + draggerRect.width / 2;
        const y = parseFloat(dragger.style.top) + draggerRect.height / 2; 

        return { x, y };
    }

    private initRecentColors() {
        const recentColors = AgColorPanel.recentColors;
        const innerHtml = recentColors.map((color: string, index: number) => {
            return (/* html */`<div class="ag-recent-color" id=${index} style="background-color: ${color}; width: 15px; height: 15px;" recent-color="${color}" tabIndex="${this.tabIndex}"></div>`);
        });

        this.recentColors.innerHTML = innerHtml.join('');
    }

    public setValue(val: string) {
        const color: _Util.Color = _Util.Color.fromString(val);
        const [h, s, b] = color.toHSB();

        this.H = (isNaN(h) ? 0 : h) / 360;
        this.A = color.a;

        const spectrumHueRect = this.spectrumHueRect || this.refreshHueRect();
        const spectrumAlphaRect = this.spectrumAlphaRect || this.refreshAlphaRect();

        this.spectrumHueSlider.style.left = `${((this.H - 1) * -spectrumHueRect.width)}px`;
        this.spectrumAlphaSlider.style.left = `${(this.A * spectrumAlphaRect.width)}px`;

        this.setSpectrumValue(s, b);
    }

    private onRecentColorClick(e: MouseEvent | KeyboardEvent) {
        const target = e.target as HTMLElement;

        if (!_.exists(target.id)) {
            return;
        }

        const id = parseInt(target.id, 10);

        this.setValue(AgColorPanel.recentColors[id]);
        this.destroy();
    }

    private addRecentColor() {
        const color = _Util.Color.fromHSB(this.H * 360, this.S, this.B, this.A);
        const rgbaColor = color.toRgbaString();

        let recentColors = AgColorPanel.recentColors;

        if (!this.colorChanged || recentColors[0] === rgbaColor) {
            return;
        }

        // remove duplicate color
        recentColors = recentColors.filter(currentColor => currentColor != rgbaColor);

        // add color to head
        recentColors = [rgbaColor].concat(recentColors);

        // ensure we don't exceed max number of recent colors
        if (recentColors.length > AgColorPanel.maxRecentColors) {
            recentColors = recentColors.slice(0, AgColorPanel.maxRecentColors);
        }

        AgColorPanel.recentColors = recentColors;
    }

    protected destroy(): void {
        this.addRecentColor();
        super.destroy();
    }
}
