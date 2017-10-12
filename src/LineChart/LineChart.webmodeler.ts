import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart, Mode } from "./components/LineChart";
import { LineChartContainerProps } from "./components/LineChartContainer";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-line-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            }),
            createElement(LineChart, {
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series) {
            return props.series.map(series => {
                const seriesOptions = series.seriesOptions.trim() ? JSON.parse(series.seriesOptions) : {};
                const sampleData = series.sampleData.trim()
                    ? JSON.parse(series.sampleData.trim())
                    : preview.getSampleTraces();

                return deepMerge.all([ seriesOptions, {
                    connectgaps: true,
                    hoveron: "points",
                    line: {
                        color: series.lineColor,
                        shape: series.lineStyle
                    },
                    mode: series.mode.replace("X", "+") as Mode,
                    name: series.name,
                    type: "scatter",
                    fill: "none",
                    x: sampleData.x || [],
                    y: sampleData.y || []
                } ]);
            });
        }

        return [ {
            connectgaps: true,
            hoveron: "points",
            name: "Sample",
            type: "scatter",
            ...preview.getSampleTraces()
        } as ScatterData ];
    }

    private static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
        return {
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: getRandomNumbers(4, 100)
        };
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}
