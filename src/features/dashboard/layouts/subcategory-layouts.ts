export type DashboardWidgetDef = {
  key: string;
  type: string; // widgetType (registry側のキー)
  loader: string; // dataLoader key
  col: number;
  row: number;
  w: number;
  h: number;
};

export type DashboardLayoutDef = {
  grid: { cols: number; rowHeight: number };
  widgets: DashboardWidgetDef[];
};

export const subcategoryLayouts: Record<string, DashboardLayoutDef> = {
  "basic-population": {
    grid: { cols: 12, rowHeight: 110 },
    widgets: [
      { key: "total-pop", type: "metric", loader: "estatTotalPopulation", col: 0, row: 0, w: 4, h: 1 },
      { key: "pop-trend", type: "chart.line", loader: "estatPopulationTimeSeries", col: 0, row: 1, w: 8, h: 3 },
      { key: "pref-map", type: "viz.pref-map", loader: "prefTopology", col: 8, row: 1, w: 4, h: 3 },
    ],
  },
};
