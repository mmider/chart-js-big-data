import type { Plugin, ChartConfiguration } from "chart.js";

// Helper function to get or create the legend list
function getOrCreateLegendList(id: string): HTMLUListElement {
  const legendContainer = document.getElementById(id);
  if (!legendContainer) {
    throw new Error(`Legend container with ID '${id}' not found.`);
  }

  let listContainer = legendContainer.querySelector("ul");

  if (!listContainer) {
    listContainer = document.createElement("ul");
    listContainer.style.display = "flex";
    listContainer.style.flexDirection = "row";
    listContainer.style.flexWrap = "wrap";
    listContainer.style.margin = "0";
    listContainer.style.padding = "0";
    // listContainer.style.listStyle = 'none';

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
}

// Define the plugin
export const htmlLegendPlugin: Plugin<"line" | "bar" | "pie" | "doughnut"> = {
  id: "htmlLegend",
  afterUpdate(chart, _args, options: { containerID: string }) {
    const ul = getOrCreateLegendList(options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    if (!chart.options.plugins?.legend?.labels?.generateLabels) return;

    const items = chart.options.plugins.legend.labels.generateLabels(chart);
    if (!items) return;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.style.alignItems = "center";
      li.style.cursor = "pointer";
      li.style.display = "flex";
      li.style.flexDirection = "row";
      li.style.marginLeft = "10px";

      li.onclick = () => {
        // FIXME I don't know why type is not recognized by the linter... It should be...
        const chartType = (chart.config as ChartConfiguration).type;
        if (chartType === "pie" || chartType === "doughnut") {
          // Pie and doughnut charts only have a single dataset, and visibility is per item
          chart.toggleDataVisibility(item.index!);
        } else {
          chart.setDatasetVisibility(
            item.datasetIndex!,
            !chart.isDatasetVisible(item.datasetIndex!),
          );
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement("span");
      boxSpan.style.display = "inline-block";
      boxSpan.style.flexShrink = "0";
      boxSpan.style.height = "20px";
      boxSpan.style.marginRight = "10px";
      boxSpan.style.width = "20px";
      if (
        item.fillStyle instanceof CanvasPattern ||
        item.fillStyle instanceof CanvasGradient
      ) {
        const canvas = document.createElement("canvas");
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = item.fillStyle; // Apply the pattern
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        boxSpan.style.backgroundImage = `url(${canvas.toDataURL()})`;
      } else {
        boxSpan.style.background = item.fillStyle as string;
      }
      boxSpan.style.borderColor = item.strokeStyle as string;
      boxSpan.style.borderWidth = `${item.lineWidth}px`;

      // Text
      const textContainer = document.createElement("p");
      textContainer.style.color = item.fontColor as string;
      textContainer.style.margin = "0";
      textContainer.style.padding = "0";
      textContainer.style.textDecoration = item.hidden ? "line-through" : "";
      textContainer.style.whiteSpace = "nowrap";
      textContainer.style.overflow = "hidden";
      textContainer.style.textOverflow = "ellipsis";

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  },
};
