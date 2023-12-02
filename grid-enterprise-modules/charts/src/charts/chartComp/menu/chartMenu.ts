import {
    _,
    AgEvent,
    AgPanel,
    AgPromise,
    Autowired,
    CHART_TOOL_PANEL_ALLOW_LIST,
    CHART_TOOL_PANEL_MENU_OPTIONS,
    CHART_TOOLBAR_ALLOW_LIST,
    ChartCreated,
    ChartMenuOptions,
    ChartToolPanelMenuOptions,
    Component,
    Events,
    GetChartToolbarItemsParams,
    PostConstruct,
    RefSelector,
    WithoutGridCommon
} from "@ag-grid-community/core";

import { TabbedChartMenu } from "./tabbedChartMenu";
import { ChartController } from "../chartController";
import { ChartTranslationService } from "../services/chartTranslationService";
import { ChartOptionsService } from "../services/chartOptionsService";
import { ExtraPaddingDirection } from "../chartProxies/chartProxy";

type ChartToolbarButtons = {
    [key in ChartMenuOptions]: [string, (e: MouseEvent) => any | void]
};

export class ChartMenu extends Component {
    @Autowired('chartTranslationService') private chartTranslationService: ChartTranslationService;

    public static EVENT_DOWNLOAD_CHART = "downloadChart";

    private buttons: ChartToolbarButtons = {
        chartSettings: ['menu', () => this.showMenu(this.defaultPanel)],
        chartData: ['menu', () => this.showMenu("chartData")],
        chartFormat: ['menu', () => this.showMenu("chartFormat")],
        chartLink: ['linked', e => this.toggleDetached(e)],
        chartUnlink: ['unlinked', e => this.toggleDetached(e)],
        chartDownload: ['save', () => this.saveChart()]
    };

    private panels: ChartToolPanelMenuOptions[] = [];
    private defaultPanel: ChartToolPanelMenuOptions;
    private buttonListenersDestroyFuncs: any[] = []

    private static TEMPLATE = /* html */ `<div>
        <div class="ag-chart-menu" ref="eMenu"></div>
        <button class="ag-button ag-chart-menu-close" ref="eHideButton">
            <span class="ag-icon ag-icon-contracted" ref="eHideButtonIcon"></span>
        </button>
    </div>`;
    @RefSelector("eMenu") private eMenu: HTMLButtonElement;
    @RefSelector("eHideButton") private eHideButton: HTMLButtonElement;
    @RefSelector("eHideButtonIcon") private eHideButtonIcon: HTMLSpanElement;

    private tabbedMenu: TabbedChartMenu;
    private menuPanel?: AgPanel;
    private menuVisible = false;
    private chartToolbarOptions: ChartMenuOptions[];

    constructor(
        private readonly eChartContainer: HTMLElement,
        private readonly eMenuPanelContainer: HTMLElement,
        private readonly chartController: ChartController,
        private readonly chartOptionsService: ChartOptionsService) {
        super(ChartMenu.TEMPLATE);
    }

    @PostConstruct
    private postConstruct(): void {
        this.createButtons();

        this.addManagedListener(this.eventService, Events.EVENT_CHART_CREATED, (e: ChartCreated) => {
            if (e.chartId === this.chartController.getChartId()) {
                const showDefaultToolPanel = Boolean(this.gridOptionsService.get('chartToolPanelsDef')?.defaultToolPanel);
                if (showDefaultToolPanel) {
                    this.showMenu(this.defaultPanel, false);
                }
            }
        });

        this.refreshMenuClasses();

        if (!this.gridOptionsService.get('suppressChartToolPanelsButton') && this.panels.length > 0) {
            this.getGui().classList.add('ag-chart-tool-panel-button-enable');
            this.addManagedListener(this.eHideButton, 'click', this.toggleMenu.bind(this));
        }

        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_API_UPDATE, this.createButtons.bind(this));
    }

    public isVisible(): boolean {
        return this.menuVisible;
    }

    public getExtraPaddingDirections(): ExtraPaddingDirection[]  {
        const topItems: ChartMenuOptions[] = ['chartLink', 'chartUnlink', 'chartDownload'];
        const rightItems: ChartMenuOptions[] = ['chartSettings', 'chartData', 'chartFormat'];

        const result: ExtraPaddingDirection[] = [];
        if (topItems.some(v => this.chartToolbarOptions.includes(v))) {
            result.push('top');
        }

        if (rightItems.some(v => this.chartToolbarOptions.includes(v))) {
            result.push(this.gridOptionsService.get('enableRtl') ? 'left' : 'right');
        }

        return result;
    }

    private getToolbarOptions(): ChartMenuOptions[] {
        const useChartToolPanelCustomisation = Boolean(this.gridOptionsService.get('chartToolPanelsDef'))

        if (useChartToolPanelCustomisation) {
            const defaultChartToolbarOptions: ChartMenuOptions[] = [
                this.chartController.isChartLinked() ? 'chartLink' : 'chartUnlink',
                'chartDownload'
            ];
    
            const toolbarItemsFunc = this.gridOptionsService.getCallback('getChartToolbarItems');
            const params: WithoutGridCommon<GetChartToolbarItemsParams> = {
                defaultItems: defaultChartToolbarOptions
            };
            let chartToolbarOptions = toolbarItemsFunc
                ? toolbarItemsFunc(params).filter(option => {
                    if (!CHART_TOOLBAR_ALLOW_LIST.includes(option)) {
                        const msg = CHART_TOOL_PANEL_ALLOW_LIST.includes(option as any)
                            ? `AG Grid: '${option}' is a Chart Tool Panel option and will be ignored since 'chartToolPanelsDef' is used. Please use 'chartToolPanelsDef.panels' grid option instead`
                            : `AG Grid: '${option}' is not a valid Chart Toolbar Option`;
                        console.warn(msg);
                        return false;
                    }

                    return true;
                })
                : defaultChartToolbarOptions;

            const panelsOverride = this.gridOptionsService.get('chartToolPanelsDef')?.panels
                ?.map(panel => {
                    const menuOption = CHART_TOOL_PANEL_MENU_OPTIONS[panel]
                    if (!menuOption) {
                        console.warn(`AG Grid - invalid panel in chartToolPanelsDef.panels: '${panel}'`);
                    }
                    return menuOption;
                })
                .filter(panel => Boolean(panel));
            this.panels = panelsOverride
                ? panelsOverride
                : Object.values(CHART_TOOL_PANEL_MENU_OPTIONS);

            // pivot charts use the column tool panel instead of the data panel
            if (this.chartController.isPivotChart()) {
                this.panels = this.panels.filter(panel => panel !== 'chartData');
            }

            const defaultToolPanel = this.gridOptionsService.get('chartToolPanelsDef')?.defaultToolPanel;
            this.defaultPanel = (defaultToolPanel && CHART_TOOL_PANEL_MENU_OPTIONS[defaultToolPanel]) || this.panels[0];

            return this.panels.length > 0
                // Only one panel is required to display menu icon in toolbar
                ? [this.panels[0], ...chartToolbarOptions]
                : chartToolbarOptions;
        } else { // To be deprecated in future. Toolbar options will be different to chart tool panels.
            let tabOptions: ChartMenuOptions[] = [
                'chartSettings',
                'chartData',
                'chartFormat',
                this.chartController.isChartLinked() ? 'chartLink' : 'chartUnlink',
                'chartDownload'
            ];
    
            const toolbarItemsFunc = this.gridOptionsService.getCallback('getChartToolbarItems');
    
            if (toolbarItemsFunc) {
                const isLegacyToolbar = this.gridOptionsService.get('suppressChartToolPanelsButton');
                const params: WithoutGridCommon<GetChartToolbarItemsParams> = {
                    defaultItems: isLegacyToolbar ? tabOptions : CHART_TOOLBAR_ALLOW_LIST
                };
    
                tabOptions = toolbarItemsFunc(params).filter(option => {
                    if (!this.buttons[option]) {
                        console.warn(`AG Grid: '${option}' is not a valid Chart Toolbar Option`);
                        return false;
                    } 
                    // If not legacy, remove chart tool panel options here,
                    // and add them all in one go below
                    else if (!isLegacyToolbar && CHART_TOOL_PANEL_ALLOW_LIST.includes(option as any)) {
                        const msg = `AG Grid: '${option}' is a Chart Tool Panel option and will be ignored. Please use 'chartToolPanelsDef.panels' grid option instead`;
                        console.warn(msg);
                        return false;
                    }
    
                    return true;
                });

                if (!isLegacyToolbar) {
                    // Add all the chart tool panels, as `chartToolPanelsDef.panels`
                    // should be used for configuration
                    tabOptions = tabOptions.concat(CHART_TOOL_PANEL_ALLOW_LIST);
                }
            }
    
            // pivot charts use the column tool panel instead of the data panel
            if (this.chartController.isPivotChart()) {
                tabOptions = tabOptions.filter(option => option !== 'chartData');
            }
    
            const ignoreOptions: ChartMenuOptions[] = ['chartUnlink', 'chartLink', 'chartDownload'];
            this.panels = tabOptions.filter(option => ignoreOptions.indexOf(option) === -1) as ChartToolPanelMenuOptions[];
            this.defaultPanel = this.panels[0];
    
            return tabOptions.filter(value =>
                ignoreOptions.indexOf(value) !== -1 ||
                (this.panels.length && value === this.panels[0])
            );
        }
    }

    private toggleDetached(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        const active = target.classList.contains('ag-icon-linked');

        target.classList.toggle('ag-icon-linked', !active);
        target.classList.toggle('ag-icon-unlinked', active);

        const tooltipKey = active ? 'chartUnlinkToolbarTooltip' : 'chartLinkToolbarTooltip';
        const tooltipTitle = this.chartTranslationService.translate(tooltipKey);
        if (tooltipTitle) {
            target.title = tooltipTitle;
        }

        this.chartController.detachChartRange();
    }

    private createButtons(): void {
        this.buttonListenersDestroyFuncs.forEach(func => func());
        this.buttonListenersDestroyFuncs = [];

        this.chartToolbarOptions = this.getToolbarOptions();
        const menuEl = this.eMenu;
        _.clearElement(menuEl);

        this.chartToolbarOptions.forEach(button => {
            const buttonConfig = this.buttons[button];
            const [iconName, callback] = buttonConfig;
            const buttonEl = _.createIconNoSpan(
                iconName,
                this.gridOptionsService,
                undefined,
                true
            )!;
            buttonEl.classList.add('ag-chart-menu-icon');

            const tooltipTitle = this.chartTranslationService.translate(button + 'ToolbarTooltip');
            if (tooltipTitle && buttonEl instanceof HTMLElement) {
                buttonEl.title = tooltipTitle;
            }

            this.buttonListenersDestroyFuncs.push(this.addManagedListener(buttonEl, 'click', callback));

            menuEl.appendChild(buttonEl);
        });
    }

    private saveChart() {
        const event: AgEvent = { type: ChartMenu.EVENT_DOWNLOAD_CHART };
        this.dispatchEvent(event);
    }

    private createMenuPanel(defaultTab: number): AgPromise<AgPanel> {
        const width = this.environment.chartMenuPanelWidth();

        const menuPanel = this.menuPanel = this.createBean(new AgPanel({
            minWidth: width,
            width,
            height: '100%',
            closable: true,
            hideTitleBar: true,
            cssIdentifier: 'chart-menu'
        }));

        menuPanel.setParentComponent(this);
        this.eMenuPanelContainer.appendChild(menuPanel.getGui());

        this.tabbedMenu = this.createBean(new TabbedChartMenu({
            controller: this.chartController,
            type: this.chartController.getChartType(),
            panels: this.panels,
            chartOptionsService: this.chartOptionsService
        }));

        this.addManagedListener(
            menuPanel,
            Component.EVENT_DESTROYED,
            () => this.destroyBean(this.tabbedMenu)
        );

        return new AgPromise((res: (arg0: any) => void) => {
            window.setTimeout(() => {
                menuPanel.setBodyComponent(this.tabbedMenu);
                this.tabbedMenu.showTab(defaultTab);
                res(menuPanel);
                this.addManagedListener(
                    this.eChartContainer,
                    'click',
                    (event: MouseEvent) => {
                        if (this.getGui().contains(event.target as HTMLElement)) {
                            return;
                        }

                        if (this.menuVisible) {
                            this.hideMenu();
                        }
                    }
                );
            }, 100);
        });
    }

    private showContainer() {
        if (!this.menuPanel) { return; }

        this.menuVisible = true;
        this.showParent(this.menuPanel.getWidth()!);
        this.refreshMenuClasses();
    }

    private toggleMenu() {
        this.menuVisible ? this.hideMenu() : this.showMenu();
    }

    public showMenu(
        /**
         * Menu panel to show. If empty, shows the existing menu, or creates the default menu if menu panel has not been created
         */
        panel?: ChartToolPanelMenuOptions,
        /**
         * Whether to animate the menu opening
         */
        animate: boolean = true
    ): void {
        if (!animate) {
            this.eMenuPanelContainer.classList.add('ag-no-transition');
        }

        if (this.menuPanel && !panel) {
            this.showContainer();
        } else {
            const menuPanel = panel || this.defaultPanel;
            let tab = this.panels.indexOf(menuPanel);
            if (tab < 0) {
                console.warn(`AG Grid: '${panel}' is not a valid Chart Tool Panel name`);
                tab = this.panels.indexOf(this.defaultPanel)
            }
    
            if (this.menuPanel) {
                this.tabbedMenu.showTab(tab);
                this.showContainer();
            } else {
                this.createMenuPanel(tab).then(this.showContainer.bind(this));
            }
        }


        if (!animate) {
            // Wait for menu to render
            setTimeout(() => {
                if (!this.isAlive()) { return; }
                this.eMenuPanelContainer.classList.remove('ag-no-transition');
            }, 500);
        }
    }

    public hideMenu(): void {
        this.hideParent();

        window.setTimeout(() => {
            this.menuVisible = false;
            this.refreshMenuClasses();
        }, 500);
    }

    private refreshMenuClasses() {
        this.eChartContainer.classList.toggle('ag-chart-menu-visible', this.menuVisible);
        this.eChartContainer.classList.toggle('ag-chart-menu-hidden', !this.menuVisible);

        if (!this.gridOptionsService.get('suppressChartToolPanelsButton')) {
            this.eHideButtonIcon.classList.toggle('ag-icon-contracted', this.menuVisible);
            this.eHideButtonIcon.classList.toggle('ag-icon-expanded', !this.menuVisible);
        }
    }

    private showParent(width: number): void {
        this.eMenuPanelContainer.style.minWidth = `${width}px`;
    }

    private hideParent(): void {
        this.eMenuPanelContainer.style.minWidth = '0';
    }

    protected destroy() {
        super.destroy();

        if (this.menuPanel && this.menuPanel.isAlive()) {
            this.destroyBean(this.menuPanel);
        }

        if (this.tabbedMenu && this.tabbedMenu.isAlive()) {
            this.destroyBean(this.tabbedMenu);
        }
    }
}
