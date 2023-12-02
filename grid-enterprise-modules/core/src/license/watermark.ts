import { Autowired, Component, PostConstruct, RefSelector } from '@ag-grid-community/core';
import { GridLicenseManager as LicenseManager } from './gridLicenseManager';

export class WatermarkComp extends Component {

    @Autowired('licenseManager') licenseManager: LicenseManager;
    @RefSelector('eLicenseTextRef') private eLicenseTextRef: HTMLElement;

    constructor() {
        super(/* html*/
            `<div class="ag-watermark">
                <div ref="eLicenseTextRef" class="ag-watermark-text"></div>
            </div>`
        );
    }

    @PostConstruct
    private postConstruct(): void {
        const show = this.shouldDisplayWatermark();
        this.setDisplayed(show);

        if (show) {
            this.eLicenseTextRef.innerText = this.licenseManager.getWatermarkMessage();

            window.setTimeout(() => this.addCssClass('ag-opacity-zero'), 0);
            window.setTimeout(() => this.setDisplayed(false), 5000);
        }
    }

    private shouldDisplayWatermark(): boolean {
        return this.licenseManager.isDisplayWatermark();
    }
}
