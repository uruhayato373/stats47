/**
 * e-Stat API データソース
 * 政府統計の総合窓口（e-Stat）から統計データを取得
 */

import { DataSourceType } from "@/types/dashboard";
import { DataSource, DataSourceError } from "./interface";

export class EStatDataSource implements DataSource {
  type: DataSourceType = "estat";

  /**
   * e-Statデータを取得
   */
  async fetchData(estatId: string, areaCode: string): Promise<any> {
    try {
      // TODO: e-Stat API実装
      // 現時点ではモックデータを返す
      console.warn(`[EStatDataSource] Mock data for ${estatId}`);

      return {
        value: 0,
        previousValue: 0,
        trend: "neutral",
        changePercent: 0,
      };
    } catch (error) {
      throw new DataSourceError(
        `Failed to fetch e-Stat data for ${estatId}`,
        "estat",
        error as Error
      );
    }
  }
}
