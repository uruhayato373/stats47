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
import { convertStatsDataToRankingFormat } from "../services/ranking-converter";
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
 * @param stats_data_id - 統計表ID
 * @param cat01 - 分類コード
 * @param isRanking - ランキング変換対象フラグ
 * @returns 更新結果
 */
export async function updateIsRankingAction(
  stats_data_id: string,
  cat01: string,
  isRanking: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    if (!stats_data_id || !cat01) {
      return { success: false, message: "stats_data_idとcat01が必要です" };
    }

    console.log(
      `[updateIsRankingAction] isRanking更新: stats_data_id=${stats_data_id}, cat01=${cat01}, isRanking=${isRanking}`
    );

    const success = await updateIsRanking(stats_data_id, cat01, isRanking);

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
 * @param stats_data_id - 統計表ID
 * @param cat01 - 分類コード
 * @param timeCode - 時間コード（オプション）
 * @returns 変換結果
 */
export async function convertToRankingAction(
  stats_data_id: string,
  cat01: string,
  timeCode?: string
): Promise<{
  success: boolean;
  message: string;
  key?: string;
  size?: number;
}> {
  try {
    if (!stats_data_id || !cat01) {
      return { success: false, message: "stats_data_idとcat01が必要です" };
    }

    console.log(
      `[convertToRankingAction] ランキング変換開始: stats_data_id=${stats_data_id}, cat01=${cat01}, timeCode=${timeCode || "auto"}`
    );

    // マッピング情報を取得
    const { findRankingMappingByKey } = await import(
      "../repositories/ranking-mappings-repository"
    );
    const mapping = await findRankingMappingByKey(stats_data_id, cat01);

    if (!mapping) {
      return { success: false, message: "マッピングが見つかりません" };
    }

    // e-Stat APIからデータ取得
    const response = await fetchStatsData(mapping.stats_data_id, {
      categoryFilter: mapping.cat01.replace(/^#/, ""), // #を除去
    });

    // データ整形
    const { formatStatsData } = await import(
      "../../stats-data/services/formatter"
    );
    const formattedData = formatStatsData(response);

    // 地域タイプの検証（必須）
    if (!mapping.area_type) {
      return {
        success: false,
        message:
          "地域タイプ（area_type）が設定されていません。CSVインポート時にarea_typeを指定するか、データベースで更新してください。",
      };
    }

    // すべての時間コードを取得
    const allTimeCodes = Array.from(
      new Set(
        formattedData.values
          .map((v) => v.dimensions.time?.code)
          .filter((code): code is string => !!code)
      )
    ).sort();

    if (allTimeCodes.length === 0) {
      return { success: false, message: "時間コードが見つかりません" };
    }

    // 時間コードが指定されている場合は、その時間コードのみ処理
    const targetTimeCodes = timeCode
      ? [timeCode]
      : allTimeCodes; // 指定がない場合は全ての時間コードを処理

    const savedFiles: Array<{ key: string; size: number; timeCode: string }> =
      [];

    // 各時間コードごとに処理
    for (const targetTimeCode of targetTimeCodes) {
      try {
        // StatsSchema[]形式に変換（指定された時間コードのみ）
        const statsSchemas = convertStatsDataToRankingFormat(
          response,
          mapping.item_code,
          targetTimeCode,
          mapping.unit || undefined
        );

        if (statsSchemas.length === 0) {
          console.warn(
            `[convertToRankingAction] 時間コード ${targetTimeCode} のデータがありません`
          );
          continue;
        }

        // R2に保存
        const result = await EstatRankingR2Repository.saveRankingData(
          mapping.area_type,
          mapping.item_code,
          targetTimeCode,
          statsSchemas
        );

        savedFiles.push({
          key: result.key,
          size: result.size,
          timeCode: targetTimeCode,
        });
      } catch (error) {
        console.error(
          `[convertToRankingAction] 時間コード ${targetTimeCode} の保存エラー:`,
          error
        );
      }
    }

    if (savedFiles.length === 0) {
      return {
        success: false,
        message: "保存できるデータがありませんでした",
      };
    }

    const totalCount = savedFiles.reduce(
      (sum, file) => sum + (file.size || 0),
      0
    );

    return {
      success: true,
      message: `ランキング変換完了: ${mapping.item_name} (${savedFiles.length}年度、合計サイズ: ${totalCount}bytes)`,
      key: savedFiles[0].key, // 最初のファイルのキーを返す（互換性のため）
      size: totalCount,
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
    stats_data_id: string;
    cat01: string;
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
      stats_data_id: string;
      cat01: string;
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

        // データ整形
        const { formatStatsData } = await import(
          "../../stats-data/services/formatter"
        );
        const formattedData = formatStatsData(response);

        // 地域タイプの検証（必須）
        if (!mapping.area_type) {
          results.push({
            stats_data_id: mapping.stats_data_id,
            cat01: mapping.cat01,
            itemName: mapping.item_name,
            success: false,
            message:
              "地域タイプ（area_type）が設定されていません。CSVインポート時にarea_typeを指定するか、データベースで更新してください。",
          });
          continue;
        }

        // すべての時間コードを取得
        const allTimeCodes = Array.from(
          new Set(
            formattedData.values
              .map((v) => v.dimensions.time?.code)
              .filter((code): code is string => !!code)
          )
        ).sort();

        if (allTimeCodes.length === 0) {
          results.push({
            stats_data_id: mapping.stats_data_id,
            cat01: mapping.cat01,
            itemName: mapping.item_name,
            success: false,
            message: "時間コードが見つかりません",
          });
          continue;
        }

        // 時間コードが指定されている場合は、その時間コードのみ処理
        const targetTimeCodes = timeCode
          ? [timeCode]
          : allTimeCodes; // 指定がない場合は全ての時間コードを処理

        const savedFiles: Array<{ key: string; size: number; timeCode: string }> =
          [];
        let totalCount = 0;

        // 各時間コードごとに処理
        for (const targetTimeCode of targetTimeCodes) {
          try {
            // StatsSchema[]形式に変換（指定された時間コードのみ）
            const statsSchemas = convertStatsDataToRankingFormat(
              response,
              mapping.item_code,
              targetTimeCode,
              mapping.unit || undefined
            );

            if (statsSchemas.length === 0) {
              console.warn(
                `[convertAllRankingsAction] 時間コード ${targetTimeCode} のデータがありません: ${mapping.item_name}`
              );
              continue;
            }

            // R2に保存
            const result = await EstatRankingR2Repository.saveRankingData(
              mapping.area_type,
              mapping.item_code,
              targetTimeCode,
              statsSchemas
            );

            savedFiles.push({
              key: result.key,
              size: result.size,
              timeCode: targetTimeCode,
            });
            totalCount += statsSchemas.length;
          } catch (error) {
            console.error(
              `[convertAllRankingsAction] 時間コード ${targetTimeCode} の保存エラー: ${mapping.item_name}`,
              error
            );
          }
        }

        if (savedFiles.length === 0) {
          results.push({
            stats_data_id: mapping.stats_data_id,
            cat01: mapping.cat01,
            itemName: mapping.item_name,
            success: false,
            message: "保存できるデータがありませんでした",
          });
          continue;
        }

        results.push({
          stats_data_id: mapping.stats_data_id,
          cat01: mapping.cat01,
          itemName: mapping.item_name,
          success: true,
          message: `変換完了: ${savedFiles.length}年度、${totalCount}件`,
          key: savedFiles[0].key, // 最初のファイルのキーを返す（互換性のため）
        });

        // APIレート制限を考慮して少し待機（100ms）
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `[convertAllRankingsAction] 変換エラー: ${mapping.item_name}`,
          error
        );
        results.push({
          stats_data_id: mapping.stats_data_id,
          cat01: mapping.cat01,
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

