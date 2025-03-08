import { MySimpleRange } from "./types/range.js";
import {
  downsampleAlerts,
  downsampleByAveraging,
  downsampleByDroppingAtRandom,
} from "./downsampling.js";
import { DEFAULT_TIMESERIES_LENGTH } from "./constants.js";
import type { BDChart, Datapoint } from "./types/chart.js";

/**
 * Extract the slice of the full data that is currently visible in the chart.
 * @param fullData
 * @param chart
 * @returns
 */
function getVisibleData(fullData: Datapoint[], chart: BDChart) {
  const xScale = chart.scales.x;
  const i0 = fullData.findLastIndex((point) => point.x < xScale.min);
  const iEnd = fullData.findIndex((point) => point.x > xScale.max);
  return fullData.slice(
    i0 === -1 ? 0 : i0,
    iEnd === -1 ? fullData.length : iEnd + 1,
  );
}

/**
 * Adjust the data displayed in the `chart` by downsampling it through averaging.
 *
 * @param fullData - The full data to downsample from. Note that at any point the actual data shown in the chart can be only a function of a subset of this data.
 * @param chart - The chart to adjust.
 * @param datasetId - The id of the dataset to adjust.
 */
export function adjustVisibleDataByAveraging(
  fullData: Datapoint[],
  chart: BDChart,
  datasetId: number,
  maxPointsToDisplay: number = DEFAULT_TIMESERIES_LENGTH,
) {
  const visibleData = getVisibleData(fullData, chart);

  if (visibleData.length > maxPointsToDisplay) {
    const decimatedData = downsampleByAveraging(
      visibleData,
      Math.ceil(visibleData.length / maxPointsToDisplay),
    ); // ~1000 points
    // linter asserts that data types are not compatible, but they are...
    // See also the documentation of the Chart.js library:
    // https://www.chartjs.org/docs/latest/general/data-structures.html
    chart.data.datasets[datasetId].data = decimatedData;
  } else {
    chart.data.datasets[datasetId].data = visibleData;
  }
}

/**
 * Adjust the alert data displayed in the `chart` by downsampling it.
 * @param fullData - The full alert data (`null`s + single alert label) to downsample from.
 * @param chart - The chart to adjust.
 * @param datasetId - The id of the dataset to adjust.
 */
export function adjustVisibleAlerts(
  fullData: Datapoint[],
  chart: BDChart,
  datasetId: number,
  maxPointsToDisplay: number = Math.round(DEFAULT_TIMESERIES_LENGTH / 2),
) {
  const xScale = chart.scales.x;
  const targetChunkT = (xScale.max - xScale.min) / maxPointsToDisplay;
  const visibleData = getVisibleData(fullData, chart);

  if (visibleData.length > maxPointsToDisplay) {
    const decimatedData = downsampleAlerts(visibleData, targetChunkT);
    // linter asserts that data types are not compatible, but they are...
    // See also the documentation of the Chart.js library:
    // https://www.chartjs.org/docs/latest/general/data-structures.html
    chart.data.datasets[datasetId].data = decimatedData;
  } else {
    chart.data.datasets[datasetId].data = visibleData;
  }
}

/**
 * Move the `y-fixed alerts` to their correct y-position.
 * @param fullData - The full data to adjust.
 * @param chart - The chart to adjust.
 * @param datasetId - The id of the dataset to adjust.
 * @param targetRange - The target range of the fixed alerts, where both `min` and `max` must be in `[0,1]` and they determine the setgment of the y-axis where the alert will be fixed to.
 */
function adjustYPositionOfFixedYAlerts(
  fullData: Datapoint[],
  chart: BDChart<"line">,
  datasetId: number,
  targetRange: MySimpleRange,
) {
  const yScale = chart.scales.y;
  const yMin = yScale.min;
  const yMax = yScale.max;
  const targetStartY = yMin + (yMax - yMin) * targetRange.min;
  const targetEndY = yMin + (yMax - yMin) * targetRange.max;
  fullData.forEach((point) => {
    if (point.y !== null) {
      point.y = targetStartY;
    }
  });

  chart.data.datasets[datasetId].fill = {
    target: {
      value: targetEndY,
    },
  };
}

/**
 * Adjust the `y-fixed alert` data displayed in the `chart` by downsampling it.
 * @param fullData - The full alert data (`null`s + single alert label) to downsample from.
 * @param chart - The chart to adjust.
 * @param datasetId - The id of the dataset to adjust.
 * @param targetRange - The target range of the fixed alerts, where both `min` and `max` must be in `[0,1]` and they determine the setgment of the y-axis where the alert will be fixed to.
 */
export function adjustVisibleFixedYAlerts(
  fullData: Datapoint[],
  chart: BDChart<"line">,
  datasetId: number,
  targetRange: MySimpleRange,
) {
  adjustYPositionOfFixedYAlerts(fullData, chart, datasetId, targetRange);
  adjustVisibleAlerts(fullData, chart, datasetId);
}

/**
 * Adjust the data displayed in the `chart` by downsampling it through dropping points at random.
 *
 * @param fullData - The full data to downsample from. Note that at any point the actual data shown in the chart can be only a function of a subset of this data.
 * @param chart - The chart to adjust.
 * @param datasetId - The id of the dataset to adjust.
 */
export function adjustVisibleDataByDropAtRandom(
  fullData: Datapoint[],
  chart: BDChart,
  datasetId: number,
  maxPointsToDisplay: number = DEFAULT_TIMESERIES_LENGTH,
) {
  const visibleData = getVisibleData(fullData, chart);

  if (visibleData.length > maxPointsToDisplay) {
    const decimatedData = downsampleByDroppingAtRandom(
      visibleData,
      Math.ceil(visibleData.length / maxPointsToDisplay),
    ); // ~1000 points
    // linter asserts that data types are not compatible, but they are...
    // See also the documentation of the Chart.js library:
    // https://www.chartjs.org/docs/latest/general/data-structures.html
    chart.data.datasets[datasetId].data = decimatedData;
  } else {
    chart.data.datasets[datasetId].data = visibleData;
  }
}
