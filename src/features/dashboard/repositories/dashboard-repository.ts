/**
 * ダッシュボードリポジトリ
 * D1データベースからダッシュボード設定とウィジェット定義を取得
 */

import {
  AreaType,
  DashboardConfig,
  LayoutType,
} from "@/types/dashboard/config";
import { DashboardWidget } from "@/types/dashboard/widget";

export interface WidgetTemplate {
  id: number;
  templateKey: string;
  name: string;
  widgetType: string;
  defaultConfig: string; // JSON
  description?: string;
}

export class DashboardRepository {
  private db: any; // D1Database instance

  constructor(db: any) {
    this.db = db;
  }

  /**
   * ダッシュボード設定を取得
   */
  async getDashboardConfig(
    subcategoryId: string,
    areaType: AreaType
  ): Promise<DashboardConfig | null> {
    const stmt = this.db
      .prepare(
        "SELECT * FROM dashboard_configs WHERE subcategory_id = ? AND area_type = ? AND is_active = 1"
      )
      .bind(subcategoryId, areaType);

    const result = await stmt.first();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      subcategoryId: result.subcategory_id,
      areaType: result.area_type as AreaType,
      layoutType: result.layout_type as LayoutType,
      version: result.version,
      isActive: result.is_active === 1,
    };
  }

  /**
   * ダッシュボードIDからウィジェット一覧を取得
   */
  async getWidgetsByDashboardId(
    dashboardId: number
  ): Promise<DashboardWidget[]> {
    const stmt = this.db
      .prepare(
        "SELECT * FROM dashboard_widgets WHERE dashboard_config_id = ? AND is_visible = 1 ORDER BY display_order"
      )
      .bind(dashboardId);

    const results = await stmt.all();

    return results.results.map((row: any) => ({
      id: row.id,
      dashboardConfigId: row.dashboard_config_id,
      widgetType: row.widget_type as any,
      widgetKey: row.widget_key,
      title: row.title,
      config: JSON.parse(row.config || "{}"),
      dataSourceType: row.data_source_type as any,
      dataSourceKey: row.data_source_key,
      displayOrder: row.display_order,
      isVisible: row.is_visible === 1,
      position: {
        gridColSpan: row.grid_col_span,
        gridRowSpan: row.grid_row_span,
      },
    }));
  }

  /**
   * ウィジェットテンプレートを取得
   */
  async getWidgetTemplate(templateKey: string): Promise<WidgetTemplate | null> {
    const stmt = this.db
      .prepare("SELECT * FROM widget_templates WHERE template_key = ?")
      .bind(templateKey);

    const result = await stmt.first();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      templateKey: result.template_key,
      name: result.name,
      widgetType: result.widget_type,
      defaultConfig: result.default_config,
      description: result.description,
    };
  }

  /**
   * 全アクティブなダッシュボード設定を取得
   */
  async getAllActiveConfigs(): Promise<DashboardConfig[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM dashboard_configs WHERE is_active = 1 ORDER BY subcategory_id, area_type"
    );

    const results = await stmt.all();

    return results.results.map((row: any) => ({
      id: row.id,
      subcategoryId: row.subcategory_id,
      areaType: row.area_type as AreaType,
      layoutType: row.layout_type as LayoutType,
      version: row.version,
      isActive: row.is_active === 1,
    }));
  }
}
