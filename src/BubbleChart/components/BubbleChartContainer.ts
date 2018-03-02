let __webpack_public_path__;
import { Component, createElement } from "react";

import BarChartContainer from "../../BarChart/components/BarChartContainer";
import deepMerge from "deepmerge";
import { fetchSeriesData, getSeriesTraces, handleOnClick, validateSeriesProps } from "../../utils/data";
import { BubbleChart } from "./BubbleChart";
import { Container, Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import BubbleChartContainerProps = Container.BubbleChartContainerProps;
import BubbleChartContainerState = Container.BubbleChartContainerState;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class BubbleChartContainer extends Component<BubbleChartContainerProps, BubbleChartContainerState> {

    state: BubbleChartContainerState = {
        alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions),
        data: [],
        seriesOptions: [],
        loading: true
    };
    private subscriptionHandle?: number;
    private defaultColors: string[] = [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ];

    render() {
        return createElement("div",
            {
                style: this.state.loading
                    ? { ...getDimensions(this.props), ...parseStyle(this.props.style) }
                    : undefined
            },
            createElement(BubbleChart, {
                ...this.props as BubbleChartContainerProps,
                series: this.state.data ? this.state.data.map(({ series }) => series) : this.props.series,
                scatterData: this.state.scatterData,
                seriesOptions: this.state.seriesOptions,
                loading: this.state.loading,
                alertMessage: this.state.alertMessage,
                onClick: handleOnClick,
                onHover: BarChartContainer.openTooltipForm
            })
        );
    }

    componentWillReceiveProps(newProps: BubbleChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.componentWillUnmount();
        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => fetchSeriesData<Data.SeriesProps>(mxObject, series)))
                .then(seriesData => {
                    this.setState({
                        loading: false,
                        data: seriesData,
                        scatterData: this.getData(seriesData),
                        seriesOptions: seriesData.map(({ series }) => series.seriesOptions || "{\n\n}")
                    });
                })
                .catch(reason => {
                    window.mx.ui.error(reason);
                    this.setState({ loading: false, data: [] });
                });
        } else {
            this.setState({ loading: false, data: [] });
        }
    }

    private getData(seriesData: Data.SeriesData<Data.SeriesProps>[]): ScatterData[] {
        return seriesData.map((data, index) =>
            this.createScatterData(data, index, this.props.devMode === "basic")
        );
    }

    private createScatterData({ data, series }: Data.SeriesData<Data.SeriesProps>, index: number, devMode = false): ScatterData {
        const rawOptions = devMode && series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
        const color: string | undefined = this.defaultColors[index];
        const { x, y, size } = getSeriesTraces({ data, series });

        return {
            ...deepMerge.all<ScatterData>([
                {
                    series, // shall be accessible via the data property of a hover/click point
                    marker: {
                        color: series.color,
                        size
                    },
                    ... BubbleChart.getDefaultSeriesOptions(series, this.props),
                    x,
                    y
                },
                rawOptions
            ]),
            customdata: data // each array element shall be returned as the custom data of a corresponding point
        };
    }
}
