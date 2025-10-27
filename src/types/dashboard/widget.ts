/**
 * ウィジェットの型定義
 */

export type WidgetType = 'metric' | 'chart' | 'table' | 'map' | 'custom';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'radial';

export type DataSourceType = 'ranking' | 'estat' | 'custom' | 'mock';

/**
 * ウィジェットの位置情報
 */
export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

/**
 * メトリックカードの設定
 */
export interface MetricCardConfig {
  title: string;
  unit: string;
  icon?: string;
  color?: string;
  showTrend?: boolean;
  showComparison?: boolean;
  decimalPlaces?: number;
  formatting?: {
    thousandsSeparator?: boolean;
    prefix?: string;
    suffix?: string;
  };
}

/**
 * チャートウィジェットの設定
 */
export interface ChartConfig {
  title: string;
  description?: string;
  chartType: ChartType;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey: string;
  yAxisKey: string;
  colorScheme?: string;
  height?: number;
}

/**
 * ウィジェット定義
 */
export interface DashboardWidget {
  id: number;
  dashboardConfigId: number;
  widgetType: WidgetType;
  widgetKey: string;
  position: WidgetPosition;
  config: MetricCardConfig | ChartConfig | Record<string, any>;
  dataSourceType: DataSourceType;
  dataSourceKey: string;
  displayOrder: number;
  isVisible: boolean;
}

/**
 * ウィジェットのデータ
 */
export interface MetricData {
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export type WidgetData = MetricData | ChartDataPoint[] | any;
