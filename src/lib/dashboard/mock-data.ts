/**
 * ダッシュボードのモックデータ
 */

import {
  ChartDataPoint,
  DashboardConfig,
  DashboardWidget,
  LayoutTemplate,
  MetricData,
} from "@/types/dashboard";

/**
 * サンプルダッシュボード設定
 */
export const mockDashboardConfig: DashboardConfig = {
  id: 1,
  subcategoryId: "dynamic-sample",
  areaType: "national",
  layoutType: "grid",
  version: 1,
  isActive: true,
};

/**
 * グリッドレイアウトテンプレート
 */
/**
 * レイアウトテンプレート取得関数（getMockLayoutTemplate追加用）
 */
export function getMockLayoutTemplate(
  layoutType: "grid" | "stacked" | "custom" = "grid"
): LayoutTemplate {
  return mockLayoutTemplate;
}

export const mockLayoutTemplate: LayoutTemplate = {
  version: "1.0",
  layoutType: "grid",
  gridConfig: {
    columns: 3,
    gap: "1rem",
    responsive: {
      mobile: { columns: 1 },
      tablet: { columns: 2 },
      desktop: { columns: 3 },
    },
  },
  sections: [
    {
      id: "metrics",
      title: "主要指標",
      gridArea: "1 / 1 / 2 / 4",
      widgetSlots: 3,
    },
    {
      id: "charts",
      title: "データ推移",
      gridArea: "2 / 1 / 3 / 4",
      widgetSlots: 2,
    },
  ],
};

/**
 * サンプルウィジェット定義
 */
export const mockDashboardWidgets: DashboardWidget[] = [
  // メトリックカード 1
  {
    id: 1,
    dashboardConfigId: 1,
    widgetType: "metric",
    widgetKey: "total-population",
    position: { row: 0, col: 0, width: 1, height: 1 },
    config: {
      title: "総人口",
      unit: "万人",
      icon: "Users",
      color: "blue",
      showTrend: true,
      decimalPlaces: 1,
      formatting: {
        thousandsSeparator: true,
      },
    },
    dataSourceType: "mock",
    dataSourceKey: "population-total",
    displayOrder: 1,
    isVisible: true,
  },
  // メトリックカード 2
  {
    id: 2,
    dashboardConfigId: 1,
    widgetType: "metric",
    widgetKey: "birth-rate",
    position: { row: 0, col: 1, width: 1, height: 1 },
    config: {
      title: "出生率",
      unit: "‰",
      icon: "TrendingUp",
      color: "green",
      showTrend: true,
      decimalPlaces: 2,
    },
    dataSourceType: "mock",
    dataSourceKey: "birth-rate",
    displayOrder: 2,
    isVisible: true,
  },
  // メトリックカード 3
  {
    id: 3,
    dashboardConfigId: 1,
    widgetType: "metric",
    widgetKey: "aging-rate",
    position: { row: 0, col: 2, width: 1, height: 1 },
    config: {
      title: "高齢化率",
      unit: "%",
      icon: "Activity",
      color: "orange",
      showTrend: true,
      decimalPlaces: 1,
    },
    dataSourceType: "mock",
    dataSourceKey: "aging-rate",
    displayOrder: 3,
    isVisible: true,
  },
  // 折れ線グラフ
  {
    id: 4,
    dashboardConfigId: 1,
    widgetType: "chart",
    widgetKey: "population-trend",
    position: { row: 1, col: 0, width: 2, height: 1 },
    config: {
      title: "人口推移",
      description: "過去10年間の人口推移",
      chartType: "line",
      showGrid: true,
      showLegend: true,
      xAxisKey: "year",
      yAxisKey: "population",
      colorScheme: "blue",
      height: 300,
    },
    dataSourceType: "mock",
    dataSourceKey: "population-trend",
    displayOrder: 4,
    isVisible: true,
  },
  // 棒グラフ
  {
    id: 5,
    dashboardConfigId: 1,
    widgetType: "chart",
    widgetKey: "age-distribution",
    position: { row: 1, col: 2, width: 1, height: 1 },
    config: {
      title: "年齢別人口分布",
      chartType: "bar",
      showGrid: true,
      showLegend: false,
      xAxisKey: "ageGroup",
      yAxisKey: "count",
      colorScheme: "green",
      height: 300,
    },
    dataSourceType: "mock",
    dataSourceKey: "age-distribution",
    displayOrder: 5,
    isVisible: true,
  },
];

/**
 * ウィジェット用モックデータ
 */
export const mockWidgetData: Record<string, any> = {
  // メトリックデータ
  "population-total": {
    value: 12580.3,
    previousValue: 12710.5,
    trend: "down",
    changePercent: -1.02,
  } as MetricData,

  "birth-rate": {
    value: 6.8,
    previousValue: 7.0,
    trend: "down",
    changePercent: -2.86,
  } as MetricData,

  "aging-rate": {
    value: 29.1,
    previousValue: 28.6,
    trend: "up",
    changePercent: 1.75,
  } as MetricData,

  // チャートデータ：人口推移
  "population-trend": [
    { year: "2014", population: 12710 },
    { year: "2015", population: 12680 },
    { year: "2016", population: 12650 },
    { year: "2017", population: 12620 },
    { year: "2018", population: 12600 },
    { year: "2019", population: 12590 },
    { year: "2020", population: 12580 },
    { year: "2021", population: 12570 },
    { year: "2022", population: 12560 },
    { year: "2023", population: 12550 },
  ] as ChartDataPoint[],

  // チャートデータ：年齢別分布
  "age-distribution": [
    { ageGroup: "0-14歳", count: 1520 },
    { ageGroup: "15-64歳", count: 7450 },
    { ageGroup: "65歳以上", count: 3610 },
  ] as ChartDataPoint[],
};

/**
 * モックデータを取得する関数
 */
export function getMockWidgetData(dataSourceKey: string): any {
  return mockWidgetData[dataSourceKey] || null;
}

/**
 * ダッシュボード設定を取得する関数（モック）
 */
export async function getMockDashboardConfig(
  subcategoryId: string,
  areaType: "national" | "prefecture"
): Promise<{
  config: DashboardConfig;
  widgets: DashboardWidget[];
  layout: LayoutTemplate;
}> {
  // 実際のAPIコールをシミュレート
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    config: mockDashboardConfig,
    widgets: mockDashboardWidgets,
    layout: mockLayoutTemplate,
  };
}
