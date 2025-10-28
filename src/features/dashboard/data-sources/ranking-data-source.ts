/**
 * Ranking API データソース
 * 既存の ranking-repository を活用してランキングデータを取得
 */

import { DataSourceType } from "@/types/dashboard";
import { DataSource, DataSourceError } from "./interface";

export class RankingDataSource implements DataSource {
  type: DataSourceType = "ranking";

  /**
   * ランキングデータを取得
   */
  async fetchData(rankingKey: string, areaCode: string): Promise<any> {
    try {
      // 既存の ranking API を呼び出す
      const response = await fetch(
        `/api/rankings/item/${encodeURIComponent(rankingKey)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ranking data: ${response.statusText}`);
      }

      const data = await response.json();

      // WidgetData形式に変換
      // TODO: 実際のデータ構造に応じて変換ロジックを実装
      return {
        value: data.value || 0,
        previousValue: data.previousValue,
        trend: data.trend,
        changePercent: data.changePercent,
      };
    } catch (error) {
      throw new DataSourceError(
        `Failed to fetch ranking data for ${rankingKey}`,
        "ranking",
        error as Error
      );
    }
  }
}
