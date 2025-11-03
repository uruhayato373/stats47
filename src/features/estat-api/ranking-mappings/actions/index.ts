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
import { MetadataGenerator } from "../services/metadata-generator";
import type { EstatRankingMapping } from "../types";

/**
 * CSV値のエスケープ処理
 */
function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  
  // カンマ、ダブルクォート、改行を含む場合はダブルクォートで囲む
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    // ダブルクォートをエスケープ
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

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

    // 変更前のマッピング情報を取得（変更前のisRanking値とarea_typeを取得するため）
    const { findRankingMappingByKey } = await import(
      "../repositories/ranking-mappings-repository"
    );
    const previousMapping = await findRankingMappingByKey(stats_data_id, cat01);

    // データベースを更新
    const success = await updateIsRanking(stats_data_id, cat01, isRanking);

    if (!success) {
      return { success: false, message: "更新に失敗しました" };
    }

    // isRankingがtrueからfalseに変更された場合、R2から関連データを削除
    if (previousMapping?.is_ranking === true && isRanking === false) {
      try {
        // マッピング情報からarea_typeとitem_codeを取得
        if (!previousMapping.area_type) {
          console.warn(
            `[updateIsRankingAction] area_typeが設定されていないため、R2データ削除をスキップ: ${stats_data_id}, ${cat01}`
          );
        } else {
          const { EstatRankingR2Repository } = await import(
            "../repositories/rankingR2Repository"
          );
          const deleteResult =
            await EstatRankingR2Repository.deleteAllRankingDataByKey(
              previousMapping.area_type,
              previousMapping.item_code
            );

          if (deleteResult.deletedCount > 0) {
            console.log(
              `[updateIsRankingAction] R2データ削除完了: ${deleteResult.deletedCount}件 (${previousMapping.item_code})`
            );
          } else {
            console.log(
              `[updateIsRankingAction] 削除対象のR2データが見つかりませんでした: ${previousMapping.item_code}`
            );
          }
        }
      } catch (error) {
        // R2削除が失敗してもデータベース更新は成功させる
        console.error(
          `[updateIsRankingAction] R2データ削除エラー（データベース更新は成功）:`,
          error
        );
      }
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
    // cat01をそのまま使用（#は除去しない）
    console.log(
      `[convertToRankingAction] データ取得: stats_data_id=${mapping.stats_data_id}, cat01=${mapping.cat01}`
    );

    const response = await fetchStatsData(mapping.stats_data_id, {
      categoryFilter: mapping.cat01,
    });

    // デバッグ: APIレスポンスの構造を確認
    const responseData =
      response?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    console.log(
      `[convertToRankingAction] APIレスポンス: VALUE.length=${Array.isArray(responseData) ? responseData.length : "not array"}`
    );
    if (Array.isArray(responseData) && responseData.length > 0) {
      const firstRawValue = responseData[0] as any;
      console.log(
        `[convertToRankingAction] 最初の生データ:`,
        JSON.stringify(
          {
            "@cat01": firstRawValue?.["@cat01"],
            "@time": firstRawValue?.["@time"],
            "@area": firstRawValue?.["@area"],
            hasValue: !!firstRawValue?.$,
          },
          null,
          2
        )
      );
    }

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

    // デバッグ: データ構造を確認
    console.log(
      `[convertToRankingAction] データ確認: values.length=${formattedData.values.length}`
    );
    if (formattedData.values.length > 0) {
      const firstValue = formattedData.values[0];
      console.log(
        `[convertToRankingAction] 最初の値の構造:`,
        JSON.stringify(
          {
            hasTime: !!firstValue.dimensions.time,
            timeCode: firstValue.dimensions.time?.code,
            timeName: firstValue.dimensions.time?.name,
            hasArea: !!firstValue.dimensions.area,
            areaCode: firstValue.dimensions.area?.code,
            hasCat01: !!firstValue.dimensions.cat01,
            cat01Code: firstValue.dimensions.cat01?.code,
          },
          null,
          2
        )
      );
    }

    // すべての時間コードを取得
    const allTimeCodes = Array.from(
      new Set(
        formattedData.values
          .map((v) => v.dimensions.time?.code)
          .filter((code): code is string => !!code && code !== "")
      )
    ).sort();

    console.log(
      `[convertToRankingAction] 検出された時間コード: ${JSON.stringify(allTimeCodes)}`
    );

    if (allTimeCodes.length === 0) {
      // より詳細なエラーメッセージを返す
      const hasValues = formattedData.values.length > 0;
      const hasTimeDimensions = formattedData.values.some(
        (v) => v.dimensions.time
      );
      const hasTimeCodes = formattedData.values.some(
        (v) => v.dimensions.time?.code
      );
      const emptyTimeCodes = formattedData.values.some(
        (v) => v.dimensions.time?.code === ""
      );

      let errorMessage = "時間コードが見つかりません";
      if (!hasValues) {
        errorMessage = "データが存在しません（valuesが空です）";
      } else if (!hasTimeDimensions) {
        errorMessage = "時間次元（time）が存在しません";
      } else if (!hasTimeCodes) {
        errorMessage = "時間コード（time.code）が存在しません";
      } else if (emptyTimeCodes) {
        errorMessage = "時間コードが空文字列です";
      }

      console.error(
        `[convertToRankingAction] 時間コード検出失敗: ${errorMessage}`,
        {
          hasValues,
          hasTimeDimensions,
          hasTimeCodes,
          emptyTimeCodes,
          valuesCount: formattedData.values.length,
        }
      );

      return { success: false, message: errorMessage };
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
        // フォーマット済みデータを渡すことで、再フォーマットを回避
        const statsSchemas = convertStatsDataToRankingFormat(
          formattedData,
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

        // 既存のR2データを削除（古いデータを削除してから新しく保存）
        try {
          // 特定の時間コードのファイルのみ削除
          await EstatRankingR2Repository.deleteRankingData(
            mapping.area_type,
            mapping.item_code,
            targetTimeCode
          );
          console.log(
            `[convertToRankingAction] 既存データ削除: ${mapping.item_code}/${targetTimeCode}`
          );
        } catch (error) {
          // ファイルが存在しない場合はエラーを無視（続行）
          console.log(
            `[convertToRankingAction] 既存データなし（新規）または削除スキップ: ${mapping.item_code}/${targetTimeCode}`
          );
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

    // メタデータを生成して保存
    try {
      const savedTimeCodes = savedFiles.map((f) => f.timeCode);
      
      // tableInfoからstatNameとtitleを取得
      const statName = formattedData.tableInfo?.statName || "";
      const title = formattedData.tableInfo?.title || "";
      
      // 既存のメタデータを取得
      const existingMetadata = await EstatRankingR2Repository.findRankingMetadata(
        mapping.area_type,
        mapping.item_code
      );

      let metadata;
      if (existingMetadata) {
        // 既存のメタデータを更新（新しい年度情報を追加、ソース情報も更新）
        metadata = MetadataGenerator.updateMetadataWithNewTimes(
          existingMetadata,
          savedTimeCodes
        );
        // ソース情報を更新（既存のメタデータがある場合でも、新しい情報で更新）
        metadata.source = {
          name: MetadataGenerator.generateSourceName(statName, title),
          url: MetadataGenerator.generateSourceUrl(mapping.stats_data_id),
        };
      } else {
        // 新規メタデータを生成
        metadata = await MetadataGenerator.generateMetadata(
          mapping,
          savedTimeCodes,
          statName,
          title
        );
      }

      // メタデータを保存
      await EstatRankingR2Repository.saveRankingMetadata(
        mapping.area_type,
        mapping.item_code,
        metadata
      );
      console.log(
        `[convertToRankingAction] メタデータを保存: ${mapping.item_code}`
      );
    } catch (error) {
      // メタデータ保存エラーは警告のみ（データ保存は成功している）
      console.warn(
        `[convertToRankingAction] メタデータ保存エラー: ${mapping.item_code}`,
        error
      );
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
 * @param mode - 処理モード（"delete_all": 全削除してから保存, "skip_existing": 既存データをスキップして新規のみ追加）
 * @returns 変換結果の配列
 */
export async function convertAllRankingsAction(
  timeCode?: string,
  mode: "delete_all" | "skip_existing" = "delete_all"
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
      `[convertAllRankingsAction] 全ランキング変換開始: timeCode=${timeCode || "auto"}, mode=${mode}`
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

    // モード1（delete_all）の場合のみ、rankingディレクトリ配下のすべてのデータを一括削除
    if (mode === "delete_all") {
      console.log("[convertAllRankingsAction] rankingディレクトリ配下の全データを一括削除開始");
      try {
        const deleteResult = await EstatRankingR2Repository.deleteAllRankingData();
        console.log(
          `[convertAllRankingsAction] rankingディレクトリ配下の全データ削除完了: ${deleteResult.deletedCount}件`
        );
      } catch (error) {
        // 削除エラーは警告のみ（変換処理は続行）
        console.warn("[convertAllRankingsAction] rankingディレクトリ配下の全データ削除エラー:", error);
      }
    } else {
      console.log("[convertAllRankingsAction] モード2（新規のみ追加）のため、全削除をスキップします");
    }

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
          `[convertAllRankingsAction] 変換中: ${mapping.item_name} (${mapping.stats_data_id}, cat01=${mapping.cat01})`
        );

        // e-Stat APIからデータ取得
        // cat01をそのまま使用（#は除去しない）
        let response;
        try {
          response = await fetchStatsData(mapping.stats_data_id, {
            categoryFilter: mapping.cat01,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message.substring(0, 100) // エラーメッセージを100文字に制限
              : "e-Stat APIからのデータ取得に失敗しました";
          console.error(
            `[convertAllRankingsAction] API取得エラー: ${mapping.item_name}`,
            error
          );
          results.push({
            stats_data_id: mapping.stats_data_id,
            cat01: mapping.cat01,
            itemName: mapping.item_name,
            success: false,
            message: `API取得エラー: ${errorMessage}`,
          });
          continue;
        }

        // データ整形
        let formattedData;
        try {
          const { formatStatsData } = await import(
            "../../stats-data/services/formatter"
          );
          formattedData = formatStatsData(response);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message.substring(0, 100) // エラーメッセージを100文字に制限
              : "データ整形に失敗しました";
          console.error(
            `[convertAllRankingsAction] データ整形エラー: ${mapping.item_name}`,
            error
          );
          results.push({
            stats_data_id: mapping.stats_data_id,
            cat01: mapping.cat01,
            itemName: mapping.item_name,
            success: false,
            message: `データ整形エラー: ${errorMessage}`,
          });
          continue;
        }

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
            // モード2（skip_existing）の場合、既存ファイルの存在確認
            if (mode === "skip_existing") {
              const exists = await EstatRankingR2Repository.hasRankingData(
                mapping.area_type,
                mapping.item_code,
                targetTimeCode
              );
              if (exists) {
                console.log(
                  `[convertAllRankingsAction] 既存データのためスキップ: ${mapping.item_name} (時間コード: ${targetTimeCode})`
                );
                // 既存ファイルがある場合はスキップ（次の時間コードに続行）
                continue;
              }
            }

            // StatsSchema[]形式に変換（指定された時間コードのみ）
            // フォーマット済みデータを渡すことで、再フォーマットを回避
            let statsSchemas;
            try {
              statsSchemas = convertStatsDataToRankingFormat(
                formattedData,
                mapping.item_code,
                targetTimeCode,
                mapping.unit || undefined
              );
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "データ変換に失敗しました";
              console.error(
                `[convertAllRankingsAction] データ変換エラー: ${mapping.item_name} (時間コード: ${targetTimeCode})`,
                error
              );
              // データ変換エラーは記録するが、次の時間コードに続行
              continue;
            }

            if (statsSchemas.length === 0) {
              console.warn(
                `[convertAllRankingsAction] 時間コード ${targetTimeCode} のデータがありません: ${mapping.item_name}`
              );
              continue;
            }

            // R2に保存
            try {
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
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "R2保存に失敗しました";
              console.error(
                `[convertAllRankingsAction] R2保存エラー: ${mapping.item_name} (時間コード: ${targetTimeCode})`,
                error
              );
              // R2保存エラーは記録するが、次の時間コードに続行
            }
          } catch (error) {
            console.error(
              `[convertAllRankingsAction] 時間コード ${targetTimeCode} の処理エラー: ${mapping.item_name}`,
              error
            );
            // 予期しないエラーも記録するが、続行
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

        // メタデータを生成して保存
        try {
          const savedTimeCodes = savedFiles.map((f) => f.timeCode);
          
          // tableInfoからstatNameとtitleを取得
          const statName = formattedData.tableInfo?.statName || "";
          const title = formattedData.tableInfo?.title || "";
          
          // 既存のメタデータを取得
          const existingMetadata = await EstatRankingR2Repository.findRankingMetadata(
            mapping.area_type,
            mapping.item_code
          );

          let metadata;
          if (existingMetadata) {
            // 既存のメタデータを更新（新しい年度情報を追加、ソース情報も更新）
            metadata = MetadataGenerator.updateMetadataWithNewTimes(
              existingMetadata,
              savedTimeCodes
            );
            // ソース情報を更新（既存のメタデータがある場合でも、新しい情報で更新）
            metadata.source = {
              name: MetadataGenerator.generateSourceName(statName, title),
              url: MetadataGenerator.generateSourceUrl(mapping.stats_data_id),
            };
          } else {
            // 新規メタデータを生成
            metadata = await MetadataGenerator.generateMetadata(
              mapping,
              savedTimeCodes,
              statName,
              title
            );
          }

          // メタデータを保存
          await EstatRankingR2Repository.saveRankingMetadata(
            mapping.area_type,
            mapping.item_code,
            metadata
          );
          console.log(
            `[convertAllRankingsAction] メタデータを保存: ${mapping.item_code}`
          );
        } catch (error) {
          // メタデータ保存エラーは警告のみ（データ保存は成功している）
          console.warn(
            `[convertAllRankingsAction] メタデータ保存エラー: ${mapping.item_code}`,
            error
          );
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
        const errorMessage =
          error instanceof Error
            ? error.message.substring(0, 100) // エラーメッセージを100文字に制限
            : "ランキング変換に失敗しました";
        results.push({
          stats_data_id: mapping.stats_data_id,
          cat01: mapping.cat01,
          itemName: mapping.item_name,
          success: false,
          message: errorMessage,
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

/**
 * 既存データに対してメタデータファイルを一括生成
 *
 * R2に保存されているすべてのランキングデータに対して、
 * metadata.jsonファイルを生成または更新します。
 *
 * @returns 生成結果
 */
export async function generateMetadataForAllRankingsAction(): Promise<{
  success: boolean;
  message: string;
  generatedCount: number;
  errorCount: number;
  errors?: Array<{ rankingKey: string; areaType: string; error: string }>;
}> {
  try {
    console.log(
      "[generateMetadataForAllRankingsAction] メタデータ一括生成開始"
    );

    // is_ranking=trueのランキングマッピングのみを取得
    const mappings = await listRankingMappings({
      isRanking: true,
      limit: 100000,
    });

    if (mappings.length === 0) {
      return {
        success: false,
        message: "ランキングマッピングがありません",
        generatedCount: 0,
        errorCount: 0,
      };
    }

    console.log(
      `[generateMetadataForAllRankingsAction] 処理対象: ${mappings.length}件`
    );

    let generatedCount = 0;
    let errorCount = 0;
    const errors: Array<{
      rankingKey: string;
      areaType: string;
      error: string;
    }> = [];

    // 各マッピングに対してメタデータを生成
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      
      // 進捗ログ（100件ごと、または最後の件）
      if (i % 100 === 0 || i === mappings.length - 1) {
        console.log(
          `[generateMetadataForAllRankingsAction] 進捗: ${i + 1}/${mappings.length}件 (成功: ${generatedCount}件、失敗: ${errorCount}件)`
        );
      }

      try {
        // タイムアウト設定（5秒）
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("タイムアウト: 5秒を超過")), 5000);
        });

        // メタデータを生成（R2から時間コードを取得、statNameとtitleは空文字列）
        // バッチ処理時はAPIを呼び出さないため、ソース名は空文字列になる
        // 必要に応じて後で更新可能
        const metadata = await Promise.race([
          MetadataGenerator.generateMetadata(
            mapping,
            undefined,
            "",
            ""
          ),
          timeoutPromise,
        ]);

        // メタデータを保存
        await EstatRankingR2Repository.saveRankingMetadata(
          mapping.area_type,
          mapping.item_code,
          metadata
        );

        generatedCount++;
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        errors.push({
          rankingKey: mapping.item_code,
          areaType: mapping.area_type,
          error: errorMessage,
        });
        console.error(
          `[generateMetadataForAllRankingsAction] メタデータ生成エラー: ${mapping.area_type}/${mapping.item_code}`,
          error
        );
        
        // エラーが多すぎる場合は中断
        if (errorCount > 100) {
          console.error(
            `[generateMetadataForAllRankingsAction] エラーが多すぎるため処理を中断します (エラー件数: ${errorCount})`
          );
          break;
        }
      }
    }

    const message = `メタデータ生成完了: 成功${generatedCount}件、失敗${errorCount}件`;

    console.log(`[generateMetadataForAllRankingsAction] ${message}`);

    return {
      success: errorCount === 0,
      message,
      generatedCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error(
      "[generateMetadataForAllRankingsAction] メタデータ一括生成エラー:",
      error
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "メタデータ一括生成に失敗しました",
      generatedCount: 0,
      errorCount: 0,
    };
  }
}

/**
 * CSVエクスポートアクション
 *
 * estat_ranking_mappingsテーブルのデータをCSV形式で取得
 *
 * @returns CSV文字列
 */
export async function exportRankingMappingsToCsvAction(): Promise<{
  success: boolean;
  csv?: string;
  message?: string;
}> {
  try {
    console.log("[exportRankingMappingsToCsvAction] CSVエクスポート開始");

    // すべてのランキングマッピングを取得
    const mappings = await listRankingMappings({
      limit: 100000, // 十分に大きな値を設定
    });

    if (mappings.length === 0) {
      return {
        success: false,
        message: "エクスポートするデータがありません",
      };
    }

    // CSVヘッダー
    const headers = [
      "stats_data_id",
      "cat01",
      "item_name",
      "item_code",
      "unit",
      "area_type",
      "is_ranking",
      "created_at",
      "updated_at",
    ];

    // CSV行を生成
    const csvRows: string[] = [];

    // ヘッダー行
    csvRows.push(headers.map((h) => escapeCsvValue(h)).join(","));

    // データ行
    for (const mapping of mappings) {
      const csvRow = [
        escapeCsvValue(mapping.stats_data_id),
        escapeCsvValue(mapping.cat01),
        escapeCsvValue(mapping.item_name),
        escapeCsvValue(mapping.item_code),
        escapeCsvValue(mapping.unit),
        escapeCsvValue(mapping.area_type),
        escapeCsvValue(mapping.is_ranking ? "1" : "0"),
        escapeCsvValue(mapping.created_at),
        escapeCsvValue(mapping.updated_at),
      ];
      csvRows.push(csvRow.join(","));
    }

    const csv = csvRows.join("\n");

    console.log(
      `[exportRankingMappingsToCsvAction] CSVエクスポート完了: ${mappings.length}件`
    );

    return {
      success: true,
      csv,
    };
  } catch (error) {
    console.error("[exportRankingMappingsToCsvAction] CSVエクスポートエラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "CSVエクスポートに失敗しました",
    };
  }
}

/**
 * @deprecated syncR2ToDatabaseAction は ranking ドメインに移動しました
 * 使用する場合は @/features/ranking/actions からインポートしてください
 *
 * 旧コードは削除され、ranking/actions/syncR2ToDatabase.ts に移動しました
 */

