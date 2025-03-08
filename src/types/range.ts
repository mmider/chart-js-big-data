/*
 * A simple range with a min and max value.
 */
export class MySimpleRange {
  readonly min: number;
  readonly max: number;

  /**
   * Creates a MySimpleRange instance and ensures min <= max.
   * @param min - The lower bound of the range.
   * @param max - The upper bound of the range.
   * @throws Error if min > max.
   */
  constructor({ min, max }: { min: number; max: number }) {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) must be <= max (${max})`);
    }
    this.min = min;
    this.max = max;
  }
}
