import { EstatDataTransformer, EstatTransformedData } from "./data-transformer";
import { EstatMetadataDatabaseService } from "./metadata-database";
import { estatAPI } from "@/services/estat-api";

export class EstatMetadataService {
  private dbService: EstatMetadataDatabaseService;

  constructor(db: D1Database) {
    this.dbService = new EstatMetadataDatabaseService(db);
  }

  // 単一の統計表IDからメタ情報を取得・変換・保存
  async fetchAndSaveMetadata(statsDataId: string): Promise<void> {
    try {
      // 1. e-Stat APIからメタ情報を取得
      const metadata = await estatAPI.getMetaInfo({ statsDataId });

      // 2. CSV形式に変換
      const transformedData =
        EstatDataTransformer.transformToCSVFormat(metadata);

      // 3. データベースに保存
      await this.dbService.saveTransformedData(transformedData);

      console.log(
        `${statsDataId}のメタ情報を保存しました: ${transformedData.length}件`
      );
    } catch (error) {
      console.error(`${statsDataId}のメタ情報保存に失敗:`, error);
      throw error;
    }
  }

  // 複数の統計表IDを一括処理
  async fetchAndSaveMultipleMetadata(statsDataIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      statsDataIds.map((id) => this.fetchAndSaveMetadata(id))
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    console.log(`一括処理完了: 成功${successCount}件, 失敗${failureCount}件`);
  }

  // 統計表IDの範囲を指定して一括処理
  async fetchAndSaveMetadataRange(
    startId: string,
    endId: string
  ): Promise<void> {
    // 統計表IDのパターンを生成（例: 0000010101 から 0000010200）
    const startNum = parseInt(startId);
    const endNum = parseInt(endId);

    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error("開始IDと終了IDは数値である必要があります");
    }

    const statsDataIds: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      statsDataIds.push(i.toString().padStart(10, "0"));
    }

    await this.fetchAndSaveMultipleMetadata(statsDataIds);
  }

  // 保存済みデータの検索
  async searchSavedMetadata(query: string): Promise<EstatTransformedData[]> {
    return await this.dbService.search(query);
  }

  // 統計表一覧取得
  async getSavedStatList(): Promise<any[]> {
    return await this.dbService.getStatList();
  }

  // データ件数取得
  async getSavedDataCount(): Promise<number> {
    return await this.dbService.getCount();
  }

  // 統計表IDで保存済みデータを取得
  async getSavedMetadataByStatsId(
    statsDataId: string
  ): Promise<EstatTransformedData[]> {
    return await this.dbService.findByStatsId(statsDataId);
  }

  // カテゴリで保存済みデータを取得
  async getSavedMetadataByCategory(
    category: string
  ): Promise<EstatTransformedData[]> {
    return await this.dbService.findByCategory(category);
  }
}
