import { Metric } from "./shadcn/Metric";
import { Line } from "./shadcn/Line";
import { PrefectureMapWidget } from "./d3/PrefectureMapWidget";

export const widgetComponents = {
  "metric": Metric,
  "chart.line": Line,
  "viz.pref-map": PrefectureMapWidget,
} as const;
