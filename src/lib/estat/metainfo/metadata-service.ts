import { EstatMetaCategoryData } from "../types";
import { EstatMetaInfoService } from "./EstatMetaInfoService";

export class EstatMetadataService {
  private metaInfoService: EstatMetaInfoService;

  constructor(db: D1Database) {
    this.metaInfoService = new EstatMetaInfoService(db);
  }

  // 単一の統計表IDからメタ情報を取得・変換・保存
  async fetchAndSaveMetadata(statsDataId: string): Promise<void> {
    const result = await this.metaInfoService.processAndSaveMetaInfo(
      statsDataId
    );
    if (!result.success) {
      throw new Error(result.error || "メタ情報の保存に失敗しました");
    }
  }

  // 複数の統計表IDを一括処理
  async fetchAndSaveMultipleMetadata(statsDataIds: string[]): Promise<void> {
    const result = await this.metaInfoService.processBulkMetaInfo(statsDataIds);
    console.log(
      `一括処理完了: 成功${result.successCount}件, 失敗${result.failureCount}件`
    );
  }

  // 統計表IDの範囲を指定して一括処理
  async fetchAndSaveMetadataRange(
    startId: string,
    endId: string
  ): Promise<void> {
    const result = await this.metaInfoService.processMetaInfoRange(
      startId,
      endId
    );
    console.log(
      `範囲処理完了: 成功${result.successCount}件, 失敗${result.failureCount}件`
    );
  }

  // 保存済みデータの検索
  async searchSavedMetadata(query: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.metaInfoService.searchMetaInfo(query);
    return result.entries;
  }

  // 統計表一覧取得
  async getSavedStatList(): Promise<
    Array<{
      stats_data_id: string;
      stat_name: string;
      title: string;
      item_count: number;
      first_created: string;
      last_updated: string;
    }>
  > {
    return await this.metaInfoService.getStatsList();
  }

  // データ件数取得
  async getSavedDataCount(): Promise<number> {
    const summary = await this.metaInfoService.getMetaInfoSummary();
    return summary.totalEntries;
  }

  // 統計表IDで保存済みデータを取得
  async getSavedMetadataByStatsId(
    statsDataId: string
  ): Promise<EstatMetaCategoryData[]> {
    const result = await this.metaInfoService.searchMetaInfo(statsDataId, {
      searchType: "stats_id",
    });
    return result.entries;
  }

  // カテゴリで保存済みデータを取得
  async getSavedMetadataByCategory(
    category: string
  ): Promise<EstatMetaCategoryData[]> {
    const result = await this.metaInfoService.searchMetaInfo(category, {
      searchType: "category",
    });
    return result.entries;
  }
}
