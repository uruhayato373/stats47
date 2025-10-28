/**
 * データソースインターフェース
 */

import { DataSourceType, WidgetData } from "@/types/dashboard";

export interface DataSource {
  type: DataSourceType;
  /**
   * データを取得
   * @param key データソースキー（例: ranking_key, estat_id）
   * @param areaCode 地域コード（例: '01000'）
   */
  fetchData(key: string, areaCode: string): Promise<WidgetData>;
}

/**
 * データ取得エラー
 */
export class DataSourceError extends Error {
  constructor(
    message: string,
    public readonly sourceType: DataSourceType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DataSourceError";
  }
}
