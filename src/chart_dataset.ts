import type { ChartDataset } from "chart.js";
import type { MySimpleRange } from "./types/range.js";
import { parameterizedPosition, skipRepeats, zipArrays } from "./utils.js";
import {
  downsampleAlerts,
  downsampleByAveraging,
  downsampleByDroppingAtRandom,
} from "./downsampling.js";
import {
  adjustVisibleAlerts,
  adjustVisibleDataByAveraging,
  adjustVisibleDataByDropAtRandom,
  adjustVisibleFixedYAlerts,
} from "./downsampling_adjustments.js";
import type {
  BDChart,
  BDChartData,
  BDChartDataset,
  Datapoint,
} from "./types/chart.js";
import { applyAlphaToRgb } from "./colors.js";

/**
 * Given a list of `alerts`, return a list of unique `alert` values that are also not in `skipAlerts`.
 * @param alerts - The list of alerts to filter.
 * @param skipAlerts - The set of alerts to skip.
 * @returns A list of unique alerts that are not in `skipAlerts`.
 */
function uniquePlottableAlerts({
  alerts,
  skipAlerts,
}: {
  alerts: (number | null)[];
  skipAlerts: Set<number>;
}): number[] {
  return (
    Array.from(new Set(alerts)).filter(
      (alert) => alert !== null && !skipAlerts.has(alert),
    ) as number[]
  ).sort();
}

/**
 * Class to create datasets for the `bigdata-chart.js`'s `Chart`s.
 */
export class BDChartDatasetMaker {
  /**
   * An alert plot with fixed y-values. Alerts are represented by rectangular labels
   * and are fixed to a specific y-range no matter the plot's y-pan or y-zoom.
   * @param time - The time vector corresponding to alerts.
   * @param alerts - A vector of alerts that correspond to the time vector.
   * @param skipAlerts - A set of `alert` labels that should not be visualized.
   * @param labelDict - A dictionary mapping `alert` labels to their string representations.
   * @param colorDict - A dictionary mapping `alert` labels to their colors.
   * @param initYPlottingRange - The initial y-range of the plot.
   * @param targetRange - The target y-range expressed as a proportion of the full y-range (both numbers between [0,1]) where the labels should be fixed.
   * @returns An array of `BDChartData` objects that can be used to create a `Chart`.
   */
  static fixedYAlertPlot({
    time,
    alerts,
    skipAlerts,
    labelDict,
    colorDict,
    initYPlottingRange,
    targetRange,
  }: {
    time: number[];
    alerts: (number | null)[];
    skipAlerts: Set<number>;
    labelDict: Record<number, string>;
    colorDict: Record<number, CanvasPattern | string>;
    initYPlottingRange: MySimpleRange;
    targetRange: MySimpleRange;
  }): BDChartData[] {
    const uniqueAlerts = uniquePlottableAlerts({ alerts, skipAlerts });
    return uniqueAlerts.map((alert) => {
      const fullData = skipRepeats(
        zipArrays(time, alerts).map((v) => ({
          x: v.x,
          y:
            v.y === alert
              ? parameterizedPosition({
                  t: targetRange.min,
                  range: initYPlottingRange,
                })
              : null,
        })),
      );

      const dataset: BDChartDataset = {
        label: labelDict[alert],
        data: downsampleAlerts(fullData),
        borderWidth: 0,
        pointRadius: 0,
        hitRadius: 3,
        // borderColor: colorDict[alert],
        borderColor: "rgba(0, 0, 0, 0)",
        fill: {
          target: {
            value: parameterizedPosition({
              t: targetRange.max,
              range: initYPlottingRange,
            }),
          },
        },
        backgroundColor: colorDict[alert],
      };

      const update = ({
        chart,
        datasetId,
      }: {
        chart: BDChart;
        datasetId: number;
      }) =>
        adjustVisibleFixedYAlerts(
          fullData,
          chart as BDChart<"line">,
          datasetId,
          targetRange,
        );

      return { dataset, update };
    });
  }

  /**
   * A standard alert plot where each alert type is represented by a differently colored rectangle.
   * @param time - The time vector corresponding to alerts.
   * @param alerts - A vector of alerts that correspond to the time vector.
   * @param skipAlerts - A set of `alert` labels that should not be visualized.
   * @param labelDict - A dictionary mapping `alert` labels to their string representations.
   * @param colorDict - A dictionary mapping `alert` labels to their colors.
   * @returns An array of `BDChartData` objects that can be used to create a `Chart`.
   */
  static standardAlertPlot({
    time,
    alerts,
    skipAlerts,
    labelDict,
    colorDict,
  }: {
    time: number[];
    alerts: (number | null)[];
    skipAlerts: Set<number>;
    labelDict: Record<number, string>;
    colorDict: Record<number, CanvasPattern | string>;
  }): BDChartData[] {
    const uniqueAlerts = uniquePlottableAlerts({ alerts, skipAlerts });
    return uniqueAlerts.map((alert, index) => {
      const fullData = skipRepeats(
        zipArrays(time, alerts).map((v) => ({
          x: v.x,
          y: v.y === alert ? index : null,
        })),
      );

      const dataset: BDChartDataset = {
        label: labelDict[alert],
        data: downsampleAlerts(fullData),
        borderWidth: 1,
        pointRadius: 0,
        hitRadius: 3,
        borderColor: colorDict[alert],
        fill: { target: { value: index + 1 } },
        backgroundColor: colorDict[alert],
      };

      const update = ({
        chart,
        datasetId,
      }: {
        chart: BDChart;
        datasetId: number;
      }) => adjustVisibleAlerts(fullData, chart, datasetId);

      return { dataset, update };
    });
  }

  /**
   * A standard line plot.
   * @param time - The time vector corresponding to the data.
   * @param xx - The data to plot.
   * @param label - The label of the dataset.
   * @param kwargs - Additional arguments for the plot (e.g. width, color, fill).
   * @returns A `BDChartData` object that can be used to create a `Chart`.
   */
  static standardLinePlot(
    time: number[],
    xx: (number | null)[],
    label: string,
    kwargs: {
      width?: number;
      color?: string;
      fill?: string | boolean;
    },
  ): BDChartData {
    const { width = 1, color = "rgb(0, 0, 0)", fill = false } = kwargs;

    const fullData = zipArrays(time, xx);

    const dataset: ChartDataset<"line", Datapoint[]> = {
      label: label,
      // linter is wrong here
      data: downsampleByAveraging(fullData),
      borderWidth: width,
      pointRadius: 0,
      // hitRadius: 3,
      borderColor: color,
      fill: fill,
      backgroundColor: applyAlphaToRgb(color, 0.6),
    };

    const update = ({
      chart,
      datasetId,
    }: {
      chart: BDChart;
      datasetId: number;
    }) => adjustVisibleDataByAveraging(fullData, chart, datasetId);

    return { dataset, update };
  }

  /**
   * A standard scatter plot.
   * @param time - The time vector corresponding to the data.
   * @param xx - The data to plot.
   * @param label - The label of the dataset.
   * @param kwargs - Additional arguments for the plot (e.g. marker, width, radius, color, fill).
   * @returns A `BDChartData` object that can be used to create a `Chart`.
   */
  static standardScatterPlot(
    time: number[],
    xx: (number | null)[],
    label: string,
    kwargs: {
      marker?: string;
      width?: number;
      radius?: number;
      color?: string;
      fill?: string | boolean;
    },
  ): BDChartData {
    const {
      radius = 1,
      width = 1,
      color = "rgb(0, 0, 0)",
      marker = "circle",
    } = kwargs;

    const fullData = zipArrays(time, xx);

    const dataset: ChartDataset<"scatter", Datapoint[]> = {
      label: label,
      type: "scatter",
      // linter is wrong here
      data: downsampleByDroppingAtRandom(fullData),
      pointStyle: marker,
      pointRadius: radius,
      borderWidth: width,
      // hitRadius: 3,
      borderColor: color,
      backgroundColor: applyAlphaToRgb(color, 0.6),
    };

    const update = ({
      chart,
      datasetId,
    }: {
      chart: BDChart;
      datasetId: number;
    }) => adjustVisibleDataByDropAtRandom(fullData, chart, datasetId);

    return { dataset, update };
  }
}
