"use server";

/**
 * e-StatランキングマッピングServer Actions
 *
 * 管理画面からランキングマッピングのCRUD操作を実行するためのServer Actionsを提供します。
 */

import { fetchStatsData } from "../../stats-data/services/fetcher";
import {
  findRankingMappingsByIsRanking,
  listRankingMappings,
  updateIsRanking,
} from "../repositories/ranking-mappings-repository";
import { EstatRankingR2Repository } from "../repositories/rankingR2Repository";
import {
  convertStatsDataToRankingFormat,
  determineAreaType,
} from "../services/ranking-converter";
import {
  importCsvContentToDatabase,
  importCsvToDatabase,
  parseCsvContent,
} from "../services/csv-importer";

import type { EstatRankingMapping } from "../types";

/**
 * CSVファイルをインポート（ファイルパス版）
 *
 * @param filePath - CSVファイルのパス（data/prefectures.csv等）
 * @returns インポート結果
 */
export async function importCsvFileAction(
  filePath: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    if (!filePath) {
      return { success: false, message: "ファイルパスが必要です" };
    }

    console.log(`[importCsvFileAction] CSVインポート開始: ${filePath}`);

    const count = await importCsvToDatabase(filePath);

    return {
      success: true,
      message: `${count}件のデータをインポートしました`,
      count,
    };
  } catch (error) {
    console.error("[importCsvFileAction] CSVインポートエラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "CSVインポートに失敗しました",
    };
  }
}

/**
 * CSVファイルをインポート（ファイルアップロード版）
 *
 * @param formData - FormData（CSVファイルを含む）
 * @returns インポート結果
 */
export async function importCsvUploadAction(
  formData: FormData
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, message: "CSVファイルが必要です" };
    }

    // ファイルタイプの検証
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      return {
        success: false,
        message: "CSVファイルを選択してください",
      };
    }

    console.log(`[importCsvUploadAction] CSVアップロード開始: ${file.name}`);

    // ファイル内容を読み込む
    const csvContent = await file.text();

    // CSVをパースしてインポート
    const count = await importCsvContentToDatabase(csvContent);

    return {
      success: true,
      message: `${count}件のデータをインポートしました`,
      count,
    };
  } catch (error) {
    console.error("[importCsvUploadAction] CSVインポートエラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "CSVインポートに失敗しました",
    };
  }
}

/**
 * isRankingフラグを更新
 *
 * @param id - マッピングID
 * @param isRanking - ランキング変換対象フラグ
 * @returns 更新結果
 */
export async function updateIsRankingAction(
  id: number,
  isRanking: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    if (!id) {
      return { success: false, message: "IDが必要です" };
    }

    console.log(
      `[updateIsRankingAction] isRanking更新: id=${id}, isRanking=${isRanking}`
    );

    const success = await updateIsRanking(id, isRanking);

    if (!success) {
      return { success: false, message: "更新に失敗しました" };
    }

    return {
      success: true,
      message: `isRankingフラグを${isRanking ? "true" : "false"}に更新しました`,
    };
  } catch (error) {
    console.error("[updateIsRankingAction] 更新エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "更新に失敗しました",
    };
  }
}

/**
 * ランキング変換実行（単一項目）
 *
 * @param mappingId - マッピングID
 * @param timeCode - 時間コード（オプション）
 * @returns 変換結果
 */
export async function convertToRankingAction(
  mappingId: number,
  timeCode?: string
): Promise<{
  success: boolean;
  message: string;
  key?: string;
  size?: number;
}> {
  try {
    if (!mappingId) {
      return { success: false, message: "マッピングIDが必要です" };
    }

    console.log(
      `[convertToRankingAction] ランキング変換開始: mappingId=${mappingId}, timeCode=${timeCode || "auto"}`
    );

    // マッピング情報を取得
    const { findRankingMappingById } = await import(
      "../repositories/ranking-mappings-repository"
    );
    const mapping = await findRankingMappingById(mappingId);

    if (!mapping) {
      return { success: false, message: "マッピングが見つかりません" };
    }

    // e-Stat APIからデータ取得
    const response = await fetchStatsData(mapping.stats_data_id, {
      categoryFilter: mapping.cat01.replace(/^#/, ""), // #を除去
    });

    // ランキング形式に変換
    const payload = convertStatsDataToRankingFormat(
      response,
      mapping.item_code,
      timeCode,
      mapping.unit || undefined
    );

    // 地域タイプを判定
    const areaCodes = payload.values.map((v) => v.areaCode);
    const areaType = determineAreaType(areaCodes);

    // R2に保存
    const result = await EstatRankingR2Repository.saveRankingData(
      areaType,
      mapping.item_code,
      payload.metadata.timeCode,
      payload
    );

    return {
      success: true,
      message: `ランキング変換完了: ${mapping.item_name} (${payload.values.length}件)`,
      key: result.key,
      size: result.size,
    };
  } catch (error) {
    console.error("[convertToRankingAction] ランキング変換エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "ランキング変換に失敗しました",
    };
  }
}

/**
 * ランキング変換実行（isRanking=trueの全項目）
 *
 * @param timeCode - 時間コード（オプション、各項目で自動判定）
 * @returns 変換結果の配列
 */
export async function convertAllRankingsAction(
  timeCode?: string
): Promise<{
  success: boolean;
  message: string;
  results: Array<{
    mappingId: number;
    itemName: string;
    success: boolean;
    message: string;
    key?: string;
  }>;
}> {
  try {
    console.log(
      `[convertAllRankingsAction] 全ランキング変換開始: timeCode=${timeCode || "auto"}`
    );

    // isRanking=trueの項目を取得
    const mappings = await findRankingMappingsByIsRanking();

    if (mappings.length === 0) {
      return {
        success: false,
        message: "ランキング変換対象の項目がありません",
        results: [],
      };
    }

    console.log(
      `[convertAllRankingsAction] ${mappings.length}件の項目を変換します`
    );

    const results: Array<{
      mappingId: number;
      itemName: string;
      success: boolean;
      message: string;
      key?: string;
    }> = [];

    // 各項目を変換
    for (const mapping of mappings) {
      try {
        console.log(
          `[convertAllRankingsAction] 変換中: ${mapping.item_name} (${mapping.stats_data_id})`
        );

        // e-Stat APIからデータ取得
        const response = await fetchStatsData(mapping.stats_data_id, {
          categoryFilter: mapping.cat01.replace(/^#/, ""), // #を除去
        });

        // ランキング形式に変換
        const payload = convertStatsDataToRankingFormat(
          response,
          mapping.item_code,
          timeCode,
          mapping.unit || undefined
        );

        // 地域タイプを判定
        const areaCodes = payload.values.map((v) => v.areaCode);
        const areaType = determineAreaType(areaCodes);

        // R2に保存
        const result = await EstatRankingR2Repository.saveRankingData(
          areaType,
          mapping.item_code,
          payload.metadata.timeCode,
          payload
        );

        results.push({
          mappingId: mapping.id,
          itemName: mapping.item_name,
          success: true,
          message: `変換完了: ${payload.values.length}件`,
          key: result.key,
        });

        // APIレート制限を考慮して少し待機（100ms）
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `[convertAllRankingsAction] 変換エラー: ${mapping.item_name}`,
          error
        );
        results.push({
          mappingId: mapping.id,
          itemName: mapping.item_name,
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "ランキング変換に失敗しました",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      success: failureCount === 0,
      message: `変換完了: 成功${successCount}件、失敗${failureCount}件`,
      results,
    };
  } catch (error) {
    console.error("[convertAllRankingsAction] 全ランキング変換エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "全ランキング変換に失敗しました",
      results: [],
    };
  }
}

/**
 * ランキングマッピング一覧を取得
 *
 * @param options - 取得オプション
 * @returns ランキングマッピングの配列
 */
export async function listRankingMappingsAction(options?: {
  isRanking?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EstatRankingMapping[]> {
  try {
    return await listRankingMappings(options);
  } catch (error) {
    console.error("[listRankingMappingsAction] 取得エラー:", error);
    return [];
  }
}

