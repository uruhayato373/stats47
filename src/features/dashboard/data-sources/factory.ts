/**
 * データソースファクトリ
 * データソースタイプに応じた適切なDataSourceインスタンスを返す
 */

import { DataSourceType } from "@/types/dashboard";
import { CustomDataSource } from "./custom-data-source";
import { EStatDataSource } from "./estat-data-source";
import { DataSource } from "./interface";
import { RankingDataSource } from "./ranking-data-source";

export class DataSourceFactory {
  /**
   * データソースタイプに応じたDataSourceインスタンスを作成
   */
  static create(type: DataSourceType): DataSource {
    switch (type) {
      case "ranking":
        return new RankingDataSource();
      case "estat":
        return new EStatDataSource();
      case "custom":
        return new CustomDataSource();
      case "mock":
        // モックデータソースは通常のDataSourceではなく、
        // API層で処理されるためここではnullを返す
        throw new Error("Mock data source should be handled at API layer");
      default:
        throw new Error(`Unknown data source type: ${type}`);
    }
  }
}
