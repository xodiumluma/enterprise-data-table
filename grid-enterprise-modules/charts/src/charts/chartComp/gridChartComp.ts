import {
    _,
    AgDialog,
    Autowired,
    CellRange,
    CHART_TOOL_PANEL_MENU_OPTIONS,
    ChartCreated,
    ChartDestroyed,
    ChartModel,
    ChartToolPanelName,
    ChartType,
    Component,
    Events,
    GridApi,
    IAggFunc,
    PopupService,
    PostConstruct,
    RefSelector,
    SeriesChartType,
    UpdateChartParams,
    WithoutGridCommon,
} from "@ag-grid-community/core";

import {AgChartInstance, AgChartThemeOverrides, AgChartThemePalette} from "ag-charts-community";
import {ChartMenu} from "./menu/chartMenu";
import {TitleEdit} from "./chartTitle/titleEdit";
import {ChartController, DEFAULT_THEMES} from "./chartController";
import {ChartDataModel, ChartModelParams} from "./model/chartDataModel";
import {BarChartProxy} from "./chartProxies/cartesian/barChartProxy";
import {AreaChartProxy} from "./chartProxies/cartesian/areaChartProxy";
import {ChartProxy, ChartProxyParams} from "./chartProxies/chartProxy";
import {LineChartProxy} from "./chartProxies/cartesian/lineChartProxy";
import {PieChartProxy} from "./chartProxies/polar/pieChartProxy";
import {ScatterChartProxy} from "./chartProxies/cartesian/scatterChartProxy";
import {HistogramChartProxy} from "./chartProxies/cartesian/histogramChartProxy";
import {ChartTranslationService} from "./services/chartTranslationService";
import {ChartCrossFilterService} from "./services/chartCrossFilterService";
import {CrossFilteringContext} from "../chartService";
import {ChartOptionsService} from "./services/chartOptionsService";
import {ComboChartProxy} from "./chartProxies/combo/comboChartProxy";

export interface GridChartParams {
    chartId: string;
    pivotChart: boolean;
    cellRange: CellRange;
    chartType: ChartType;
    chartThemeName?: string;
    insideDialog: boolean;
    suppressChartRanges: boolean;
    aggFunc?: string | IAggFunc;
    chartThemeOverrides?: AgChartThemeOverrides;
    unlinkChart?: boolean;
    crossFiltering: boolean;
    crossFilteringContext: CrossFilteringContext;
    chartOptionsToRestore?: AgChartThemeOverrides;
    chartPaletteToRestore?: AgChartThemePalette;
    seriesChartTypes?: SeriesChartType[];
    crossFilteringResetCallback?: () => void;
}

export class GridChartComp extends Component {
    private static TEMPLATE = /* html */
        `<div class="ag-chart" tabindex="-1">
            <div ref="eChartContainer" tabindex="-1" class="ag-chart-components-wrapper">
                <div ref="eChart" class="ag-chart-canvas-wrapper"></div>
                <div ref="eEmpty" class="ag-chart-empty-text ag-unselectable"></div>
            </div>
            <div ref="eTitleEditContainer"></div>
            <div ref="eMenuContainer" class="ag-chart-docked-container" style="min-width: 0px;"></div>
        </div>`;

    @RefSelector('eChart') private readonly eChart: HTMLElement;
    @RefSelector('eChartContainer') private readonly eChartContainer: HTMLElement;
    @RefSelector('eMenuContainer') private readonly eMenuContainer: HTMLElement;
    @RefSelector('eEmpty') private readonly eEmpty: HTMLElement;
    @RefSelector('eTitleEditContainer') private readonly eTitleEditContainer: HTMLDivElement;

    @Autowired('chartCrossFilterService') private readonly crossFilterService: ChartCrossFilterService;
    @Autowired('chartTranslationService') private readonly chartTranslationService: ChartTranslationService;

    @Autowired('gridApi') private readonly gridApi: GridApi;
    @Autowired('popupService') private readonly popupService: PopupService;

    private chartMenu: ChartMenu;
    private titleEdit: TitleEdit;
    private chartDialog: AgDialog;

    private chartController: ChartController;
    private chartOptionsService: ChartOptionsService;

    private chartProxy: ChartProxy;
    private chartType: ChartType;

    private readonly params: GridChartParams;

    // function to clean up the 'color-scheme-change' event listener
    private onDestroyColorSchemeChangeListener: () => void;

    constructor(params: GridChartParams) {
        super(GridChartComp.TEMPLATE);
        this.params = params;
    }

    @PostConstruct
    public init(): void {
        const modelParams: ChartModelParams = {
            chartId: this.params.chartId,
            pivotChart: this.params.pivotChart,
            chartType: this.params.chartType,
            chartThemeName: this.getThemeName(),
            aggFunc: this.params.aggFunc,
            cellRange: this.params.cellRange,
            suppressChartRanges: this.params.suppressChartRanges,
            unlinkChart: this.params.unlinkChart,
            crossFiltering: this.params.crossFiltering,
            seriesChartTypes: this.params.seriesChartTypes,
        };

        const isRtl = this.gridOptionsService.get('enableRtl');

        this.addCssClass(isRtl ? 'ag-rtl' : 'ag-ltr');

        // only the chart controller interacts with the chart model
        const model = this.createBean(new ChartDataModel(modelParams));
        this.chartController = this.createManagedBean(new ChartController(model));

        this.validateCustomThemes();

        // create chart before dialog to ensure dialog is correct size
        this.createChart();

        if (this.params.insideDialog) {
            this.addDialog();
        }

        this.addMenu();
        this.addTitleEditComp();

        this.addManagedListener(this.getGui(), 'focusin', this.setActiveChartCellRange.bind(this));
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_MODEL_UPDATE, this.update.bind(this));

        this.addManagedPropertyListeners(['chartThemeOverrides', 'chartThemes'], this.reactivePropertyUpdate.bind(this));

        if (this.chartMenu) {
            // chart menu may not exist, i.e. cross filtering
            this.addManagedListener(this.chartMenu, ChartMenu.EVENT_DOWNLOAD_CHART, () => this.downloadChart());
        }

        this.update();
        this.raiseChartCreatedEvent();
    }

    private createChart(): void {
        // if chart already exists, destroy it and remove it from DOM
        let chartInstance: AgChartInstance | undefined = undefined;
        if (this.chartProxy) {
            chartInstance = this.chartProxy.destroy({ keepChartInstance: true });
        }

        const crossFilterCallback = (event: any, reset: boolean) => {
            const ctx = this.params.crossFilteringContext;
            ctx.lastSelectedChartId = reset ? '' : this.chartController.getChartId();
            if (reset) {
                this.params.crossFilteringResetCallback!();
            }
            this.crossFilterService.filter(event, reset);
        };

        const chartType = this.chartController.getChartType();
        const chartProxyParams: ChartProxyParams = {
            chartType,
            chartInstance,
            getChartThemeName: this.getChartThemeName.bind(this),
            getChartThemes: this.getChartThemes.bind(this),
            customChartThemes: this.gridOptionsService.get('customChartThemes'),
            getGridOptionsChartThemeOverrides: () => this.getGridOptionsChartThemeOverrides(),
            getExtraPaddingDirections: () => this.chartMenu?.getExtraPaddingDirections() ?? [],
            apiChartThemeOverrides: this.params.chartThemeOverrides,
            crossFiltering: this.params.crossFiltering,
            crossFilterCallback,
            parentElement: this.eChart,
            grouping: this.chartController.isGrouping(),
            chartThemeToRestore: this.params.chartThemeName,
            chartOptionsToRestore: this.params.chartOptionsToRestore,
            chartPaletteToRestore: this.params.chartPaletteToRestore,
            seriesChartTypes: this.chartController.getSeriesChartTypes(),
            translate: (toTranslate: string, defaultText?: string) => this.chartTranslationService.translate(toTranslate, defaultText),
        };

        // ensure 'restoring' options are not reused when switching chart types
        this.params.chartOptionsToRestore = undefined;

        // set local state used to detect when chart changes
        this.chartType = chartType;

        this.chartProxy = GridChartComp.createChartProxy(chartProxyParams);
        if (!this.chartProxy) {
            console.warn('AG Grid: invalid chart type supplied: ', chartProxyParams.chartType);
            return;
        }

        const canvas = this.eChart.querySelector('canvas');
        if (canvas) {
            canvas.classList.add('ag-charts-canvas');
        }

        this.chartController.setChartProxy(this.chartProxy);
        this.chartOptionsService = this.createBean(new ChartOptionsService(this.chartController));
        this.titleEdit && this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
    }
    
    private getChartThemeName(): string {
        return this.chartController.getChartThemeName();
    }

    private getChartThemes(): string[] {
        return this.chartController.getThemes();
    }

    private getGridOptionsChartThemeOverrides(): AgChartThemeOverrides | undefined {
        return this.gridOptionsService.get('chartThemeOverrides');
    }

    private static createChartProxy(chartProxyParams: ChartProxyParams): ChartProxy {
        switch (chartProxyParams.chartType) {
            case 'column':
            case 'bar':
            case 'groupedColumn':
            case 'stackedColumn':
            case 'normalizedColumn':
            case 'groupedBar':
            case 'stackedBar':
            case 'normalizedBar':
                return new BarChartProxy(chartProxyParams);
            case 'pie':
            case 'doughnut':
                return new PieChartProxy(chartProxyParams);
            case 'area':
            case 'stackedArea':
            case 'normalizedArea':
                return new AreaChartProxy(chartProxyParams);
            case 'line':
                return new LineChartProxy(chartProxyParams);
            case 'scatter':
            case 'bubble':
                return new ScatterChartProxy(chartProxyParams);
            case 'histogram':
                return new HistogramChartProxy(chartProxyParams);
            case 'columnLineCombo':
            case 'areaColumnCombo':
            case 'customCombo':
                return new ComboChartProxy(chartProxyParams);
            default:
                throw `AG Grid: Unable to create chart as an invalid chartType = '${chartProxyParams.chartType}' was supplied.`;
        }
    }

    private addDialog(): void {
        const title = this.chartTranslationService.translate(this.params.pivotChart ? 'pivotChartTitle' : 'rangeChartTitle');

        const { width, height } = this.getBestDialogSize();

        this.chartDialog = new AgDialog({
            resizable: true,
            movable: true,
            maximizable: true,
            title,
            width,
            height,
            component: this,
            centered: true,
            closable: true
        });

        this.getContext().createBean(this.chartDialog);

        this.chartDialog.addEventListener(AgDialog.EVENT_DESTROYED, () => this.destroy());
    }

    private getBestDialogSize(): { width: number, height: number; } {
        const popupParent = this.popupService.getPopupParent();
        const maxWidth = _.getAbsoluteWidth(popupParent) * 0.75;
        const maxHeight = _.getAbsoluteHeight(popupParent) * 0.75;
        const ratio = 0.553;

        const chart = this.chartProxy.getChart();
        let width = this.params.insideDialog ? 850 : chart.width;
        let height = this.params.insideDialog ? 470 : chart.height;

        if (width > maxWidth || height > maxHeight) {
            width = Math.min(width, maxWidth);
            height = Math.round(width * ratio);

            if (height > maxHeight) {
                height = maxHeight;
                width = Math.min(width, Math.round(height / ratio));
            }
        }

        return { width, height };
    }

    private addMenu(): void {
        if (!this.params.crossFiltering) {
            this.chartMenu = this.createBean(new ChartMenu(this.eChartContainer, this.eMenuContainer, this.chartController, this.chartOptionsService));
            this.eChartContainer.appendChild(this.chartMenu.getGui());
        }
    }

    private addTitleEditComp(): void {
        this.titleEdit = this.createBean(new TitleEdit(this.chartMenu));
        this.eTitleEditContainer.appendChild(this.titleEdit.getGui());
        if (this.chartProxy) {
            this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
        }
    }

    public update(params?: UpdateChartParams): void {
        // update chart model for api.updateChart()
        if (params?.chartId) {
            const validUpdate = this.chartController.update(params);
            if (!validUpdate) {
                return; // warning already logged!
            }
        }

        const chartTypeChanged = this.chartTypeChanged(params);

        // recreate chart if chart type has changed
        if (chartTypeChanged) this.createChart();

        // update chart options if chart type hasn't changed or if overrides are supplied
        this.updateChart(params?.chartThemeOverrides);

        if (params?.chartId) {
            this.chartProxy.getChart().waitForUpdate().then(() => {
                this.chartController.raiseChartApiUpdateEvent();
            });
        }
    }

    private updateChart(updatedOverrides?: AgChartThemeOverrides): void {
        const { chartProxy } = this;

        const selectedCols = this.chartController.getSelectedValueColState();
        const fields = selectedCols.map(c => ({ colId: c.colId, displayName: c.displayName }));
        const data = this.chartController.getChartData();
        const chartEmpty = this.handleEmptyChart(data, fields);

        if (chartEmpty) {
            return;
        }

        let chartUpdateParams = this.chartController.getChartUpdateParams(updatedOverrides);
        chartProxy.update(chartUpdateParams);

        this.chartProxy.getChart().waitForUpdate().then(() => {
            this.chartController.raiseChartUpdatedEvent();
        });

        this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
    }

    private chartTypeChanged(updateParams?: UpdateChartParams): boolean {
        const [currentType, updatedChartType] = [this.chartController.getChartType(), updateParams?.chartType];
        return this.chartType !== currentType || (!!updatedChartType && this.chartType !== updatedChartType);
    }

    public getChartModel(): ChartModel {
        return this.chartController.getChartModel();
    }

    public getChartImageDataURL(fileFormat?: string): string {
        return this.chartProxy.getChartImageDataURL(fileFormat);
    }

    private handleEmptyChart(data: any[], fields: any[]): boolean {
        const pivotModeDisabled = this.chartController.isPivotChart() && !this.chartController.isPivotMode();
        let minFieldsRequired = 1;

        if (this.chartController.isActiveXYChart()) {
            minFieldsRequired = this.chartController.getChartType() === 'bubble' ? 3 : 2;
        }
        const isEmptyChart = fields.length < minFieldsRequired || data.length === 0;

        if (this.eChart) {
            const isEmpty = pivotModeDisabled || isEmptyChart;
            _.setDisplayed(this.eChart, !isEmpty);
            _.setDisplayed(this.eEmpty, isEmpty);
        }

        if (pivotModeDisabled) {
            this.eEmpty.innerText = this.chartTranslationService.translate('pivotChartRequiresPivotMode');
            return true;
        }

        if (isEmptyChart) {
            this.eEmpty.innerText = this.chartTranslationService.translate('noDataToChart');
            return true;
        }

        return false;
    }

    public downloadChart(dimensions?: { width: number, height: number }, fileName?: string, fileFormat?: string): void {
        this.chartProxy.downloadChart(dimensions, fileName, fileFormat);
    }

    public openChartToolPanel(panel?: ChartToolPanelName) {
        const menuPanel = panel ? CHART_TOOL_PANEL_MENU_OPTIONS[panel] : panel;
        this.chartMenu.showMenu(menuPanel);
    }

    public closeChartToolPanel() {
        this.chartMenu.hideMenu();
    }

    public getChartId(): string {
        return this.chartController.getChartId();
    }

    public getUnderlyingChart() {
        return this.chartProxy.getChartRef();
    }

    public crossFilteringReset(): void {
        this.chartProxy.crossFilteringReset();
    }

    private setActiveChartCellRange(focusEvent: FocusEvent): void {
        if (this.getGui().contains(focusEvent.relatedTarget as HTMLElement)) {
            return;
        }

        this.chartController.setChartRange(true);
        (this.gridApi as any).focusService.clearFocusedCell();
    }

    private getThemeName(): string {
        const availableChartThemes = this.gridOptionsService.get('chartThemes') || DEFAULT_THEMES;

        if (availableChartThemes.length === 0) {
            throw new Error('Cannot create chart: no chart themes available.');
        }

        const { chartThemeName } = this.params;
        return _.includes(availableChartThemes, chartThemeName) ? chartThemeName! : availableChartThemes[0];
    }

    private validateCustomThemes() {
        const suppliedThemes = this.getChartThemes();
        const customChartThemes = this.gridOptionsService.get('customChartThemes');
        if (customChartThemes) {
            _.getAllKeysInObjects([customChartThemes]).forEach(customThemeName => {
                if (!_.includes(suppliedThemes, customThemeName)) {
                    console.warn("AG Grid: a custom chart theme with the name '" + customThemeName + "' has been " +
                        "supplied but not added to the 'chartThemes' list");
                }
            });
        }
    }

    private reactivePropertyUpdate(): void {
        // switch to the first theme if the current theme is unavailable
        this.chartController.setChartThemeName(this.getThemeName(), true);

        const chartId = this.getChartId();
        const modelType = this.chartController.isCrossFilterChart()
            ? 'crossFilter'
            : this.getChartModel().modelType;

        // standalone requires that `undefined` / `null` values are supplied as `{}`
        const chartThemeOverrides = this.gridOptionsService.get('chartThemeOverrides') || {};

        this.update({
            type: `${modelType}ChartUpdate`,
            chartId,
            chartThemeOverrides
        });
    }

    private raiseChartCreatedEvent(): void {
        const event: WithoutGridCommon<ChartCreated> = {
            type: Events.EVENT_CHART_CREATED,
            chartId: this.chartController.getChartId()
        };

        this.chartProxy.getChart().waitForUpdate().then(() => {
            this.eventService.dispatchEvent(event);
        });
    }

    private raiseChartDestroyedEvent(): void {
        const event: WithoutGridCommon<ChartDestroyed> = {
            type: Events.EVENT_CHART_DESTROYED,
            chartId: this.chartController.getChartId(),
        };

        this.eventService.dispatchEvent(event);
    }

    protected destroy(): void {
        super.destroy();

        if (this.chartProxy) {
            this.chartProxy.destroy();
        }

        this.destroyBean(this.chartMenu);
        this.destroyBean(this.titleEdit);

        // don't want to invoke destroy() on the Dialog (prevents destroy loop)
        if (this.chartDialog && this.chartDialog.isAlive()) {
            this.destroyBean(this.chartDialog);
        }

        this.onDestroyColorSchemeChangeListener?.();

        // if the user is providing containers for the charts, we need to clean up, otherwise the old chart
        // data will still be visible although the chart is no longer bound to the grid
        const eGui = this.getGui();
        _.clearElement(eGui);
        // remove from parent, so if user provided container, we detach from the provided dom element
        _.removeFromParent(eGui);

        this.raiseChartDestroyedEvent();
    }
}
