/**
 * ダッシュボードリポジトリ（モック版）
 * 開発環境用のフォールバック実装
 */

import { AreaType, DashboardConfig } from "@/types/dashboard/config";
import { DashboardWidget } from "@/types/dashboard/widget";
import { DashboardRepository, WidgetTemplate } from "./dashboard-repository";

export class MockDashboardRepository extends DashboardRepository {
  constructor() {
    // DBインスタンスなしで初期化
    super(null as any);
  }

  async getDashboardConfig(
    subcategoryId: string,
    areaType: AreaType
  ): Promise<DashboardConfig | null> {
    // モックデータを返す
    return {
      id: 1,
      subcategoryId,
      areaType,
      layoutType: "grid",
      version: 1,
      isActive: true,
    };
  }

  async getWidgetsByDashboardId(
    dashboardId: number
  ): Promise<DashboardWidget[]> {
    // デフォルトウィジェット定義を返す
    return [
      {
        id: 1,
        dashboardConfigId: dashboardId,
        widgetType: "metric",
        widgetKey: "metric-1",
        position: { row: 0, col: 0, width: 1, height: 1 },
        config: {
          title: "総人口",
          unit: "人",
          icon: "Users",
          color: "blue",
          showTrend: true,
        },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 1,
        isVisible: true,
      },
      {
        id: 2,
        dashboardConfigId: dashboardId,
        widgetType: "chart",
        widgetKey: "line-1",
        position: { row: 1, col: 0, width: 2, height: 1 },
        config: {
          title: "人口推移",
          chartType: "line",
          xAxisKey: "year",
          yAxisKey: "value",
          height: 300,
        },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 2,
        isVisible: true,
      },
      {
        id: 3,
        dashboardConfigId: dashboardId,
        widgetType: "chart",
        widgetKey: "bar-1",
        position: { row: 1, col: 2, width: 1, height: 1 },
        config: {
          title: "比較グラフ",
          chartType: "bar",
          xAxisKey: "label",
          yAxisKey: "value",
          height: 300,
        },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 3,
        isVisible: true,
      },
    ];
  }

  async getWidgetTemplate(templateKey: string): Promise<WidgetTemplate | null> {
    return {
      id: 1,
      templateKey,
      name: "デフォルトテンプレート",
      widgetType: "metric",
      defaultConfig: '{"size": "large"}',
    };
  }

  async getAllActiveConfigs(): Promise<DashboardConfig[]> {
    return [];
  }
}
