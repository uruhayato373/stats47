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
        title: "メトリックカード",
        config: { size: "large" },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 1,
        isVisible: true,
        position: {
          gridColSpan: 1,
          gridRowSpan: 1,
        },
      },
      {
        id: 2,
        dashboardConfigId: dashboardId,
        widgetType: "line-chart",
        widgetKey: "line-1",
        title: "折れ線グラフ",
        config: { height: 300 },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 2,
        isVisible: true,
        position: {
          gridColSpan: 2,
          gridRowSpan: 2,
        },
      },
      {
        id: 3,
        dashboardConfigId: dashboardId,
        widgetType: "bar-chart",
        widgetKey: "bar-1",
        title: "棒グラフ",
        config: { height: 300 },
        dataSourceType: "ranking",
        dataSourceKey: "totalAreaExcluding",
        displayOrder: 3,
        isVisible: true,
        position: {
          gridColSpan: 2,
          gridRowSpan: 2,
        },
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
