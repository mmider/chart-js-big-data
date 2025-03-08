import { DEFAULT_TIMESERIES_LENGTH } from "./constants.js";
import type { Datapoint } from "./types/chart.js";
import { skipRepeats } from "./utils.js";

/**
 * Downsamples the data by averaging the values of the points in windows of size `stride`.
 * @param data - The data to downsample.
 * @param stride - The size of the window to average the values of. The data are effectively downsampled to the size `data.length / stride`.
 * @param maxPointsToDisplay - The maximum number of points to display without downsampling.
 * @returns Downsampled data.
 */
export function downsampleByAveraging(
  data: Datapoint[],
  stride?: number,
  maxPointsToDisplay: number = DEFAULT_TIMESERIES_LENGTH,
): Datapoint[] {
  if (stride === undefined) {
    stride = Math.ceil(data.length / DEFAULT_TIMESERIES_LENGTH);
  }

  if (stride <= 1) {
    return data;
  }
  if (data.length <= maxPointsToDisplay) {
    return data;
  }

  const result: Datapoint[] = [];
  for (let i = 0; i < data.length; i += stride) {
    const chunk = data.slice(i, i + stride);
    const avgX = chunk.reduce((sum, point) => sum + point.x, 0) / chunk.length;
    const chunkValidY = chunk.filter((point) => point.y !== null) as {
      x: number;
      y: number;
    }[];
    let avgY: number | null = null;
    if (chunkValidY.length > 0) {
      avgY =
        chunkValidY.reduce((sum, point) => sum + point.y, 0) /
        chunkValidY.length;
    }
    result.push({ x: avgX, y: avgY });
  }
  return result;
}

/**
 * Downsamples the alerts by binning. The y-values of the data are assumed to comprise of either:
 * `null` values or a single alert value. The data is downsampled by converting the
 * x-range (i.e. time-range) into bricks of length `targetChunkT` and creating new
 * alert labels for each brick, based on a rule: if any of the points in the brick
 * has an alert, the brick is labeled with the alert, otherwise it is labeled with `null`.
 * @param data - The alert data to downsample.
 * @param targetChunkT - The target length of the bricks. If not provided, the target length is set to the length of the data divided by `DEFAULT_TIMESERIES_LENGTH / 2`.
 * @param maxPointsToDisplay - The maximum number of points to display without downsampling.
 * @returns Downsampled alert data.
 */
export function downsampleAlerts(
  data: Datapoint[],
  targetChunkT?: number,
  maxPointsToDisplay: number = DEFAULT_TIMESERIES_LENGTH / 2,
): Datapoint[] {
  if (data.length <= 2) {
    return data;
  }

  if (targetChunkT === undefined) {
    targetChunkT =
      (data[data.length - 1].x - data[0].x) / (DEFAULT_TIMESERIES_LENGTH / 2);
  }

  if (targetChunkT <= 0) {
    throw new Error("Target chunk size must be greater than 0.");
  }

  const uniqueAlerts = Array.from(new Set(data.map((point) => point.y))).filter(
    (alert) => alert !== null,
  );
  if (uniqueAlerts.length > 1) {
    throw new Error(
      "Cannot downsample alerts with more than one unique alert.",
    );
  }
  if (uniqueAlerts.length === 0) {
    return data;
  }
  const alert = uniqueAlerts[0];

  if (data.length <= maxPointsToDisplay) {
    return data;
  }

  const result: Datapoint[] = [];
  let i0 = 0;
  let t0 = data[i0].x;
  for (let i = 1; i < data.length; i += 1) {
    if (i === data.length - 1 || data[i].x - t0 >= targetChunkT) {
      if (data.slice(i0, i + 1).some((value) => value.y !== null)) {
        result.push({ x: data[i0].x, y: alert });
        result.push({ x: data[i].x, y: alert });
      } else {
        result.push({ x: data[i0].x, y: null });
        result.push({ x: data[i].x, y: null });
      }
      i0 = i + 1;
      if (i0 < data.length) {
        t0 = data[i0].x;
      }
    }
  }
  return skipRepeats(result);
}

/**
 * Downsamples the data by dropping points at random.
 * @param data - The data to downsample.
 * @param stride - The size of the window to drop points from. The data are effectively downsampled to the size `data.length / stride`.
 * @param maxPointsToDisplay - The maximum number of points to display without downsampling.
 * @returns The downsampled data.
 */
export function downsampleByDroppingAtRandom(
  data: Datapoint[],
  stride?: number,
  maxPointsToDisplay: number = DEFAULT_TIMESERIES_LENGTH,
): Datapoint[] {
  if (stride === undefined) {
    stride = Math.ceil(data.length / DEFAULT_TIMESERIES_LENGTH);
  }

  if (stride <= 1) {
    return data;
  }
  if (data.length <= maxPointsToDisplay) {
    return data;
  }

  const result: Datapoint[] = [];
  for (let i = 0; i < data.length; i += stride) {
    const chunk = data.slice(i, i + stride);
    const chunkValidY = chunk.filter((point) => point.y !== null) as {
      x: number;
      y: number;
    }[];
    if (chunkValidY.length === 0) {
      const randomIndex = Math.floor(Math.random() * chunk.length);
      result.push(chunk[randomIndex]);
    } else {
      const randomIndex = Math.floor(Math.random() * chunkValidY.length);
      result.push(chunkValidY[randomIndex]);
    }
  }
  return result;
}
