import "chartjs-adapter-luxon";
import Chart from "chart.js/auto";
import { type ScaleOptionsByType } from "chart.js";
import type { _DeepPartialObject } from "./types/deep_partial.js";
import type { ZoomPluginOptions } from "chartjs-plugin-zoom/types/options.js";
import { htmlLegendPlugin } from "./html_legend_plugin.js";
import type { BDChartConfiguration, BDChartDataset } from "./types/chart.js";

export class ZoomPluginImporter {
  static isImported = false;

  static async import() {
    if (this.isImported) return;
    if (import.meta.env.SSR) return;
    import("chartjs-plugin-zoom").then((zoomPlugin) => {
      Chart.register(zoomPlugin.default as any);
      this.isImported = true;
    });
  }
}

ZoomPluginImporter.import();

/**
 * Pick the direction of the pan based on the user input.
 * By default pans in `x` direction only. If the shift key is pressed, pans in `y` direction.
 * @param chart - The chart to pick the pan direction for.
 * @param event - The event to base the direction on.
 */
function pickPanDirection({
  chart,
  event,
}: {
  chart: Chart;
  event: HammerInput;
}): boolean | undefined {
  if (!chart?.options?.plugins?.zoom?.pan) {
    return true;
  }
  chart.options.plugins.zoom.pan.mode = event.srcEvent.altKey ? "y" : "x";
  return true;
}

/**
 * Pick the direction of the zoom based on the user input.
 * By default zooms in `x` direction only. If the shift key is pressed, zooms in `y` direction.
 * @param chart - The chart to pick the zoom direction for.
 * @param event - The event to base the direction on.
 */
function pickZoomDirection({
  chart,
  event,
}: {
  chart: Chart;
  event: Event;
}): boolean | undefined {
  if (!chart?.options?.plugins?.zoom?.zoom) {
    return true;
  }
  chart.options.plugins.zoom.zoom.mode =
    event instanceof WheelEvent && event.altKey ? "y" : "x";
  return true;
}

/**
 * Configuration of the x-scale of the chart to be time based.
 * @param position - The position of the x-scale.
 * @returns The configuration of the x-scale.
 */
function xScaleConfig({
  position = "bottom",
}: {
  position?:
    | "left"
    | "right"
    | "bottom"
    | "top"
    | "center"
    | _DeepPartialObject<{
        [scale: string]: number;
      }>
    | undefined;
}): _DeepPartialObject<ScaleOptionsByType<"time">> {
  return {
    type: "time",
    position,
    time: {
      displayFormats: {
        second: "HH:mm:ss.SSS",
        minute: "HH:mm:ss",
        hour: "HH:mm:ss",
      },
    },
    ticks: {
      maxTicksLimit: 10,
    },
    title: {
      display: true,
      text: "Time",
    },
    adapters: {
      date: {
        zone: "UTC",
      },
    },
  };
}
/**
 * Defines the standard options for the zoom plugin, with pan and zoom enabled.
 */
const zoomPluginOptions: _DeepPartialObject<ZoomPluginOptions> = {
  pan: {
    enabled: true,
    mode: "x",
    onPanStart: pickPanDirection,
  },
  zoom: {
    wheel: {
      enabled: true,
    },
    mode: "x",
    onZoomStart: pickZoomDirection,
  },
};

/**
 * Create a standard line plot configuration.
 * @param datasets - The datasets to be displayed in the plot.
 * @param yLabel - The label of the y-axis.
 * @param legendId - The dom id of the legend.
 * @param position - The position of the legend.
 * @param min - The minimum value to be imposed on the y-axis.
 * @param max - The maximum value to be imposed on the y-axis.
 * @returns
 */
export function standardLinePlotConfig({
  datasets,
  yLabel,
  legendId = undefined,
  position = "bottom",
  min = undefined,
  max = undefined,
}: {
  datasets: BDChartDataset[];
  yLabel: string;
  legendId?: string | undefined;
  position?: "top" | "bottom" | "left" | "right";
  min?: number | undefined;
  max?: number | undefined;
}): BDChartConfiguration {
  const plugins: any = {
    // linter is wrong here, this is a valid type
    // TODO perhaps investigate further why the linter is wrong here
    htmlLegend:
      legendId === undefined
        ? undefined
        : {
            containerID: legendId,
          },
    legend: {
      display: false,
    },
    zoom: zoomPluginOptions,
  };
  return {
    type: "line",
    data: { datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: xScaleConfig({ position }),
        y: {
          title: {
            display: true,
            text: yLabel,
          },
          min,
          max,
          afterUpdate: function (scale) {
            scale.width = 54;
          },
        },
      },
      plugins: plugins,
    },
    plugins: legendId === undefined ? [] : [htmlLegendPlugin],
  };
}
