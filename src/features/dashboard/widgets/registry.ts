import { Metric } from "./shadcn/Metric";
import { Line } from "./shadcn/Line";
import { PrefectureMapWidget } from "./d3/PrefectureMapWidget";
import { loadPrefectureTopology } from "../actions/loaders/gis";
import { loadPopulationTimeSeries, loadTotalPopulation } from "../actions/loaders/estat";

export const widgetComponents = {
  "metric": Metric,
  "chart.line": Line,
  "viz.pref-map": PrefectureMapWidget,
} as const;

export const dataLoaders = {
  prefTopology: loadPrefectureTopology,
  estatPopulationTimeSeries: loadPopulationTimeSeries,
  estatTotalPopulation: loadTotalPopulation,
} as const;
