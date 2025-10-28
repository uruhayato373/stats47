/**
 * カスタムデータソース
 * R2ストレージまたはローカルファイルからJSONデータを取得
 */

import { DataSourceType } from "@/types/dashboard";
import { DataSource, DataSourceError } from "./interface";

export class CustomDataSource implements DataSource {
  type: DataSourceType = "custom";

  /**
   * カスタムデータを取得
   */
  async fetchData(customKey: string, areaCode: string): Promise<any> {
    try {
      // TODO: R2ストレージまたはローカルファイルから読み込み
      console.warn(`[CustomDataSource] Mock data for ${customKey}`);

      return {
        value: 0,
        previousValue: 0,
        trend: "neutral",
        changePercent: 0,
      };
    } catch (error) {
      throw new DataSourceError(
        `Failed to fetch custom data for ${customKey}`,
        "custom",
        error as Error
      );
    }
  }
}
