import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "../BarChart/components/BarChart";
import { BarChartContainerProps } from "../BarChart/components/BarChartContainer";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-column-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            }),
            createElement(BarChart, {
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: BarChartContainerProps): ScatterData[] {
        if (props.series) {
            return props.series.map(series => {
                const seriesOptions = series.seriesOptions.trim() ? JSON.parse(series.seriesOptions) : {};
                const sampleData = series.sampleData && series.sampleData.trim()
                    ? JSON.parse(series.sampleData.trim())
                    : preview.getSampleTraces();

                return deepMerge.all([ seriesOptions, {
                    name: series.name,
                    type: "bar",
                    orientation: "v",
                    x: sampleData.x || [],
                    y: sampleData.y || []
                } ]);
            });
        }

        return [
            {
                type: "bar",
                orientation: "v",
                name: "Sample",
                ...preview.getSampleTraces()
            } as ScatterData
        ];
    }

    private static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
        return {
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: getRandomNumbers(4, 100)
        };
    }
}

export function getVisibleProperties(valueMap: BarChartContainerProps, visibilityMap: VisibilityMap<BarChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.series && Array.isArray(valueMap.series)) {
        valueMap.series.forEach((series, index) => {
            if (series.dataSourceType === "XPath") {
                visibilityMap.series[index].dataSourceMicroflow = false;
            } else if (series.dataSourceType === "microflow") {
                visibilityMap.series[index].entityConstraint = false;
            }
            if (valueMap.devMode === "basic") {
                visibilityMap.series[index].seriesOptions = false;
                visibilityMap.series[index].sampleData = false;
            }
        });
    }
    if (valueMap.devMode === "basic") {
        visibilityMap.layoutOptions = false;
    }

    return visibilityMap;
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("../ui/Accordion.scss") +
        require("../ui/Sidebar.css")
    );
}
