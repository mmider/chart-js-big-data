# chart-js-big-data

Efficient plotting of large timeseries data, based on [Chart.js](https://www.chartjs.org/) backend.

This package provides functionality for creating 4 common types of plots for visualizing large timeseries data:

- Line plot
- Scatter plot
- Alert plot (Shows alerts in a form of bars showing the duration of the alert)
- Fixed-Y alert plot (Same as alert plot, but the Y-axis position is fixed)

We provide API for creating configurations for these plots:

```typescript
standardLinePlotConfig;
```

and for creating datasets:

```typescript
BDChartDatasetMaker.standardLinePlot;
BDChartDatasetMaker.standardScatterPlot;
BDChartDatasetMaker.standardAlertPlot;
BDChartDatasetMaker.fixedYAlertPlot;
```

As well as manager that can be used for synchronization of axes between plots:

```typescript
BDChartManager;
```

## Example

We will soon provide an example of how to use this package.

## Installation

To install run:

```bash
bun add @mider-solutions/chart-js-big-data
```
