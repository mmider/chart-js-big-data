import type { Chart } from "chart.js";
import type { BDChart, BDChartAndUpdate } from "./types/chart.js";

export class BDChartManager {
  chartsAndUpdates: BDChartAndUpdate[] = [];

  destroy() {
    if (this.chartsAndUpdates.length > 0) {
      for (const c of this.chartsAndUpdates) {
        c.chart.destroy();
      }
      this.chartsAndUpdates = [];
    }
  }

  attachSynchronizationBetweenCharts() {
    for (const chAndUpdt of this.chartsAndUpdates) {
      const sourceChart = chAndUpdt.chart;
      const pan = sourceChart.options.plugins?.zoom?.pan;
      const zoom = sourceChart.options.plugins?.zoom?.zoom;
      if (!pan) {
        return;
      }
      if (!zoom) {
        return;
      }

      pan.onPanComplete = ({ chart }) => {
        const bdchart = chart as BDChart;
        if (bdchart.userData) {
          const i = bdchart.userData.index;
          this.chartsAndUpdates[i].update({ chart: bdchart });
        } else {
          for (const _chAndUpdt of this.chartsAndUpdates) {
            if (_chAndUpdt.chart === chart) {
              _chAndUpdt.update({ chart: bdchart });
            }
          }
        }
        this.synchronizeAxes(chart);
      };

      zoom.onZoomComplete = ({ chart }) => {
        const bdchart = chart as BDChart;
        if (bdchart.userData) {
          const i = bdchart.userData.index;
          this.chartsAndUpdates[i].update({ chart: bdchart });
        } else {
          for (const _chAndUpdt of this.chartsAndUpdates) {
            if (_chAndUpdt.chart === chart) {
              _chAndUpdt.update({ chart: bdchart });
            }
          }
        }
        this.synchronizeAxes(chart);
      };
    }
  }

  synchronizeAxes(sourceChart: Chart) {
    // Delay synchronization until the original chart completes rendering
    requestAnimationFrame(() => {
      const xScale = sourceChart.scales["x"]; // Get x-axis scale
      this.chartsAndUpdates.forEach((targetChAndUpdt) => {
        const targetChart = targetChAndUpdt.chart;

        if (targetChart !== sourceChart) {
          if (!targetChart.options.scales?.x) {
            return;
          }

          // Synchronize axis limits
          targetChart.options.scales.x.min = xScale.min;
          targetChart.options.scales.x.max = xScale.max;

          // Update the axis limits before proceeding to updating the resolution/range of shown data
          targetChart.update();

          targetChAndUpdt.update({ chart: targetChAndUpdt.chart });
        }
      });
    });
  }
}
