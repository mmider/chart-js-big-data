import {
  Chart,
  type ChartConfiguration,
  type ChartDataset,
  type ChartType,
  type ChartTypeRegistry,
} from "chart.js";

/**
 * Format of the datapoint that can be passed to the `bigdata-chart.js`'s `Chart`s.
 */
export type Datapoint = {
  /*
   * The x value of the data point (most timeseries plots expect a Timestamp in Milliseconds)
   */
  x: number;
  /*
   * The y value of the data point. Can be missing (null).
   */
  y: null | number;
};

/**
 * Function type annotation for an update function called on every user interaction with the chart.
 * (Version that updates all datasets.)
 */
export type BDChartUpdater = ({ chart }: { chart: BDChart }) => void;

/**
 * Function type annotation for an update function called on every user interaction with the chart.
 * (Version that updates only a single dataset.)
 */
export type ChartSingleDatasetUpdater = (context: {
  chart: BDChart;
  datasetId: number;
}) => void;

/**
 * Type returned by the plotting functions in `BigDataChartDataset`.
 */
export type BDChartData<TType extends ChartType = keyof ChartTypeRegistry> = {
  /**
   * Dataset to plot
   */
  dataset: ChartDataset<TType, Datapoint[]>;
  /**
   * Update function to call on every user interaction with the chart.
   */
  update: ChartSingleDatasetUpdater;
};

export type BDChartDataset<TType extends ChartType = keyof ChartTypeRegistry> =
  ChartDataset<TType, Datapoint[]>;

export type BDChart<TType extends ChartType = keyof ChartTypeRegistry> = Chart<
  TType,
  Datapoint[]
>;

export type BDChartConfiguration<
  TType extends ChartType = keyof ChartTypeRegistry,
> = ChartConfiguration<TType, Datapoint[]>;

export type BDChartAndUpdate = { chart: BDChart; update: BDChartUpdater };
