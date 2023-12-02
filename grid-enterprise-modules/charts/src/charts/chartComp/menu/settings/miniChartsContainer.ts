import {
    _,
    AgGroupComponent,
    Autowired,
    ChartGroupsDef,
    ChartType,
    Component,
    DEFAULT_CHART_GROUPS,
    PostConstruct
} from "@ag-grid-community/core";
import { ChartController } from "../../chartController";
import { ChartTranslationService } from "../../services/chartTranslationService";
import {
    MiniArea,
    MiniAreaColumnCombo,
    MiniBar,
    MiniBubble,
    MiniColumn,
    MiniColumnLineCombo,
    MiniCustomCombo,
    MiniDoughnut,
    MiniHistogram,
    MiniLine,
    MiniNormalizedArea,
    MiniNormalizedBar,
    MiniNormalizedColumn,
    MiniPie,
    MiniScatter,
    MiniStackedArea,
    MiniStackedBar,
    MiniStackedColumn,
} from "./miniCharts/index"; // please leave this as is - we want it to be explicit for build reasons

const miniChartMapping = {
    columnGroup: {
        column: MiniColumn,
        stackedColumn: MiniStackedColumn,
        normalizedColumn: MiniNormalizedColumn
    },
    barGroup: {
        bar: MiniBar,
        stackedBar: MiniStackedBar,
        normalizedBar: MiniNormalizedBar
    },
    pieGroup: {
        pie: MiniPie,
        doughnut: MiniDoughnut
    },
    lineGroup: {
        line: MiniLine
    },
    scatterGroup: {
        scatter: MiniScatter,
        bubble: MiniBubble
    },
    areaGroup: {
        area: MiniArea,
        stackedArea: MiniStackedArea,
        normalizedArea: MiniNormalizedArea
    },
    histogramGroup: {
        histogram: MiniHistogram
    },
    combinationGroup: {
        columnLineCombo: MiniColumnLineCombo,
        areaColumnCombo: MiniAreaColumnCombo,
        customCombo: MiniCustomCombo
    }
}

export class MiniChartsContainer extends Component {

    static TEMPLATE = /* html */ `<div class="ag-chart-settings-mini-wrapper"></div>`;

    private readonly fills: string[];
    private readonly strokes: string[];
    private wrappers: { [key: string]: HTMLElement } = {};
    private chartController: ChartController;

    private chartGroups: ChartGroupsDef;

    @Autowired('chartTranslationService') private chartTranslationService: ChartTranslationService;

    constructor(chartController: ChartController, fills: string[], strokes: string[], chartGroups: ChartGroupsDef = DEFAULT_CHART_GROUPS) {
        super(MiniChartsContainer.TEMPLATE);

        this.chartController = chartController;
        this.fills = fills;
        this.strokes = strokes;
        this.chartGroups = {...chartGroups};
    }

    @PostConstruct
    private init() {
        // hide MiniCustomCombo if no custom combo exists
        if (!this.chartController.customComboExists() && this.chartGroups.combinationGroup) {
            this.chartGroups.combinationGroup = this.chartGroups.combinationGroup.filter(chartType => chartType !== 'customCombo');
        }

        const eGui = this.getGui();

        Object.keys(this.chartGroups).forEach((group: keyof ChartGroupsDef) => {
            const chartGroupValues = this.chartGroups[group];
            const groupComponent = this.createBean(new AgGroupComponent({
                title: this.chartTranslationService.translate(group),
                suppressEnabledCheckbox: true,
                enabled: true,
                suppressOpenCloseIcons: true,
                cssIdentifier: 'charts-settings',
                direction: 'horizontal'
            }));

            chartGroupValues!.forEach((chartType: keyof ChartGroupsDef[typeof group]) => {
                const MiniClass = miniChartMapping[group]?.[chartType] as any;
                if (!MiniClass) {
                    _.warnOnce(`invalid chartGroupsDef config '${group}${miniChartMapping[group] ? `.${chartType}` : ''}'`);
                    return;
                }

                const miniWrapper = document.createElement('div');
                miniWrapper.classList.add('ag-chart-mini-thumbnail');

                const miniClassChartType: ChartType = MiniClass.chartType;
                this.addManagedListener(miniWrapper, 'click', () => {
                    this.chartController.setChartType(miniClassChartType);
                    this.updateSelectedMiniChart();
                });

                this.wrappers[miniClassChartType] = miniWrapper;

                this.createBean(new MiniClass(miniWrapper, this.fills, this.strokes));
                groupComponent.addItem(miniWrapper);
            });

            eGui.appendChild(groupComponent.getGui());
        });

        this.updateSelectedMiniChart();
    }

    public updateSelectedMiniChart(): void {
        const selectedChartType = this.chartController.getChartType();
        for (const miniChartType in this.wrappers) {
            const miniChart = this.wrappers[miniChartType];
            const selected = miniChartType === selectedChartType;
            miniChart.classList.toggle('ag-selected', selected);
        }
    }
}
