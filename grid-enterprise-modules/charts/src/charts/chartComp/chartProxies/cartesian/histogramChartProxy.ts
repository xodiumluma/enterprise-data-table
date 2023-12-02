import { AgCartesianAxisOptions, AgHistogramSeriesOptions } from "ag-charts-community";
// import { AgCartesianAxisOptions, AgHistogramSeriesOptions } from "ag-charts-enterprise";
import { ChartProxyParams, UpdateParams } from "../chartProxy";
import { CartesianChartProxy } from "./cartesianChartProxy";

export class HistogramChartProxy extends CartesianChartProxy {

    public constructor(params: ChartProxyParams) {
        super(params);
    }

    public getSeries(params: UpdateParams): AgHistogramSeriesOptions[] {
        const firstField = params.fields[0]; // multiple series are not supported!
        return [
            {
                type: this.standaloneChartType,
                xKey: firstField.colId,
                xName: firstField.displayName,
                yName: this.chartProxyParams.translate("histogramFrequency"),
                areaPlot: false, // only constant width is supported via integrated charts
            } as AgHistogramSeriesOptions
        ];
    }

    public getAxes(_params: UpdateParams): AgCartesianAxisOptions[] {
        return [
            {
                type: 'number',
                position: 'bottom',
            },
            {
                type: 'number',
                position: 'left',
            },
        ];
    }

}
