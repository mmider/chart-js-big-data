import type { Datapoint } from "./types/chart.js";
import { MySimpleRange } from "./types/range.js";

/**
 * Zip two arrays into an array of {x, y} pairs.
 */
export function zipArrays<T, U>(array1: T[], array2: U[]): { x: T; y: U }[] {
  if (array1.length != array2.length) {
    throw new Error("Arrays must have the same length");
  }
  return array1.map((x, i) => ({ x, y: array2[i] }));
}

/**
 * Remove points that are the same as their neighbors
 * @param xx - The data to remove the repeats from.
 * @returns Data without repeated points.
 */
export function skipRepeats(xx: Datapoint[]): Datapoint[] {
  if (xx.length < 3) {
    return xx;
  }

  const dropIndices: Set<number> = new Set();
  for (let i = 1; i < xx.length - 1; i++) {
    if (xx[i].y === xx[i + 1].y && xx[i].y === xx[i - 1].y) {
      dropIndices.add(i);
    }
  }
  return xx.filter((_, index) => !dropIndices.has(index));
}

/**
 * Calculate the range of a list of numbers.
 * @param vv - The list of numbers to calculate the range of.
 * @returns The range (min, max) of the list of numbers.
 */
function range(vv: (number | null)[]): MySimpleRange | null {
  const vvFiltered = vv.filter((v) => v !== null);
  if (vvFiltered.length === 0) {
    return null;
  }
  return new MySimpleRange({
    min: Math.min(...vvFiltered),
    max: Math.max(...vvFiltered),
  });
}

/**
 * Given a list of timeseries data, calculate the overall range for all timeseries.
 * @param vvv - The list of lists of numbers to calculate the range of.
 * @returns The range (min, max) of the list of lists of numbers.
 *
 * @example
 * ```typescript
 * const stock_apple = [980.4,981.2,...]
 * const stock_nvidia = [589.2,578.5,...]
 * const stock_amd = [508.2, 481.9,...]
 * const stock_prices = [stock_apple, stock_nvidia, stock_amd]
 * const plrange = commonRange(stock_prices)
 * console.log(plrange)
 * ```
 */
export function commonRange(vvv: (number | null)[][]): MySimpleRange {
  const ranges = vvv.map(range).filter((r) => r !== null);
  if (ranges.length === 0) {
    return { min: 0, max: 1 };
  }
  return new MySimpleRange({
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
  });
}
/**
 * Find the position inside a `range`, parameterized by t on `[0,1]` that traverses `range` at a uniform speed.
 * @param t - The proportion of the range to traverse.
 * @param range - The total range.
 * @returns The position inside the range that corresponds to `t`.
 */
export function parameterizedPosition({
  t,
  range,
}: {
  t: number;
  range: MySimpleRange;
}): number {
  if (t < 0 || t > 1) {
    throw new Error("Proportion must be between 0 and 1.");
  }
  return range.min + t * (range.max - range.min);
}
