export interface BaseChartConfig {
  dataPath: string;
  fallbackImage?: string;
  className?: string;
}

export interface ChoroplethMapConfig extends BaseChartConfig {
  valueField: string;
  unit?: string;
  colorScheme?: string;
}

export interface LineChartConfig extends BaseChartConfig {
  xField: string;
  yField: string;
  seriesField?: string;
  unit?: string;
}

export interface BarChartConfig extends BaseChartConfig {
  xField: string;
  yField: string;
  unit?: string;
  orientation?: "horizontal" | "vertical";
}

export interface ScatterPlotConfig extends BaseChartConfig {
  xDataset: string;
  yDataset: string;
  xLabel?: string;
  yLabel?: string;
  showRegression?: boolean;
}

export interface RankingTableConfig extends BaseChartConfig {
  title?: string;
  valueLabel?: string;
  limit?: number;
  order?: "top" | "bottom";
  paginated?: boolean;
  displayUnit?: string;
}

export type ChartConfig =
  | ChoroplethMapConfig
  | LineChartConfig
  | BarChartConfig
  | ScatterPlotConfig
  | RankingTableConfig;
