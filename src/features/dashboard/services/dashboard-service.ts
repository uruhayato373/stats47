/**
 * ダッシュボードサービス
 * ダッシュボード設定とウィジェット定義を統合して返す
 */

import { getMockLayoutTemplate } from "../../../../data/mock/dashboard/mock-data";
import {
  AreaType,
  DashboardConfig,
  LayoutTemplate,
  LayoutType,
} from "@/types/dashboard/config";
import { DashboardWidget } from "@/types/dashboard/widget";
import { DashboardRepository } from "../repositories/dashboard-repository";

/**
 * 解決されたダッシュボード
 */
export interface ResolvedDashboard {
  config: DashboardConfig;
  widgets: DashboardWidget[];
  layout: LayoutTemplate;
}

export class DashboardService {
  private repository: DashboardRepository;

  constructor(repository: DashboardRepository) {
    this.repository = repository;
  }

  /**
   * ダッシュボード設定を解決
   * 設定とウィジェットを統合して返す
   */
  async resolveDashboard(
    subcategoryId: string,
    areaType: AreaType
  ): Promise<ResolvedDashboard | null> {
    // 1. ダッシュボード設定を取得
    const config = await this.repository.getDashboardConfig(
      subcategoryId,
      areaType
    );

    if (!config) {
      return null;
    }

    // 2. ウィジェット定義を取得
    const widgets = await this.repository.getWidgetsByDashboardId(config.id);

    // 3. レイアウトテンプレートを取得
    const layout = await this.getLayoutTemplate(config.layoutType);

    return {
      config,
      widgets,
      layout,
    };
  }

  /**
   * レイアウトテンプレートを取得
   */
  async getLayoutTemplate(layoutType: LayoutType): Promise<LayoutTemplate> {
    // 現時点ではモックデータから取得
    // TODO: データベースまたはR2ストレージから取得
    return getMockLayoutTemplate(layoutType);
  }

  /**
   * 全アクティブなダッシュボード一覧を取得
   */
  async getAllDashboards(): Promise<ResolvedDashboard[]> {
    const configs = await this.repository.getAllActiveConfigs();

    const dashboards: ResolvedDashboard[] = [];

    for (const config of configs) {
      const widgets = await this.repository.getWidgetsByDashboardId(config.id);
      const layout = await this.getLayoutTemplate(config.layoutType);

      dashboards.push({
        config,
        widgets,
        layout,
      });
    }

    return dashboards;
  }
}
