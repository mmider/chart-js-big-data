import "chart.js";

declare module "chart.js" {
  interface Chart {
    userData?: Record<string, any>;
  }
}
export {};
