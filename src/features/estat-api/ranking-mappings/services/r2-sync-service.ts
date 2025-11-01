import "server-only";

/**
 * R2→D1同期サービス
 *
 * R2ストレージのrankingディレクトリを走査し、ranking_itemsテーブルを自動生成・更新する機能を提供します。
 */

import { getD1 } from "../../db/d1";
import { EstatRankingR2Repository } from "../repositories/rankingR2Repository";
import type { StatsSchema } from "@/types/stats";

/**
 * R2から抽出したランキング項目情報
 */
export interface R2RankingItemInfo {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  unit: string;
  dataSourceId: string;
}

/**
 * 同期結果
 */
export interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    scanned: number; // 走査したrankingKey数
    created: number; // 新規作成した件数
    updated: number; // 更新した件数
    deleted: number; // 削除した件数（R2に存在しないranking_key）
    skipped: number; // スキップした件数（エラーなど）
    errors: Array<{ rankingKey: string; error: string }>; // エラー詳細
  };
}

/**
 * R2ディレクトリ走査とメタデータ抽出
 */
export class R2SyncService {
  /**
   * R2のrankingディレクトリを走査し、rankingKeyを抽出
   *
   * @param areaType - 地域タイプ（指定がない場合は全地域タイプを走査）
   * @returns 抽出したrankingKeyとメタデータの配列
   */
  static async scanRankingDirectory(
    areaType?: "prefecture" | "city" | "national"
  ): Promise<R2RankingItemInfo[]> {
    const areaTypes: Array<"prefecture" | "city" | "national"> = areaType
      ? [areaType]
      : ["prefecture", "city", "national"];

    const results: R2RankingItemInfo[] = [];
    const processedKeys = new Set<string>(); // 重複排除用

    for (const at of areaTypes) {
      try {
        // ranking/{areaType}/ のprefixでリストアップ
        const prefix = `ranking/${at}/`;
        const keys = await EstatRankingR2Repository.listRankingKeys(at);

        // キーからrankingKeyを抽出
        // パターン: ranking/{areaType}/{rankingKey}/{timeCode}.json
        const pattern = new RegExp(
          `^ranking/${at}/([^/]+)/([^/]+)\\.json$`
        );

        // キーをグループ化（同じrankingKeyのキーをまとめる）
        const rankingKeyMap = new Map<string, string[]>();

        for (const key of keys) {
          const match = key.match(pattern);
          if (!match) continue;

          const [, rankingKey, timeCode] = match;

          if (!rankingKeyMap.has(rankingKey)) {
            rankingKeyMap.set(rankingKey, []);
          }
          rankingKeyMap.get(rankingKey)!.push(key);
        }

        // 各rankingKeyに対して処理（最初に見つかったファイルを使用）
        for (const [rankingKey, fileKeys] of rankingKeyMap.entries()) {
          // 既に処理済みのrankingKeyはスキップ（異なるareaTypeでも同一rankingKeyは1回だけ処理）
          const keyId = `${rankingKey}`;
          if (processedKeys.has(keyId)) {
            continue;
          }

          // 最初のファイルを使用
          const key = fileKeys[0];

          try {
            // ファイルキーからtimeCodeを抽出
            const fileMatch = key.match(pattern);
            if (!fileMatch) continue;
            const [, , fileTimeCode] = fileMatch;

            // メタデータ抽出（1つのJSONファイルを読み取り）
            const statsSchemas = await EstatRankingR2Repository.findRankingData(
              at,
              rankingKey,
              fileTimeCode
            );

            if (!statsSchemas || statsSchemas.length === 0) {
              console.warn(
                `[R2SyncService] データが空です: ${key}`
              );
              continue;
            }

            // unitを抽出（最初の要素から）
            const unit = statsSchemas[0]?.unit || "";

            if (!unit) {
              console.warn(
                `[R2SyncService] unitが取得できません: ${key}`
              );
              continue;
            }

            results.push({
              rankingKey,
              areaType: at,
              unit,
              dataSourceId: "estat",
            });

            processedKeys.add(keyId);
          } catch (error) {
            console.error(
              `[R2SyncService] メタデータ抽出エラー: ${key}`,
              error
            );
            // エラーが発生しても続行
          }
        }
      } catch (error) {
        console.error(
          `[R2SyncService] ディレクトリ走査エラー: ranking/${at}/`,
          error
        );
        // エラーが発生しても続行
      }
    }

    return results;
  }

  /**
   * ranking_itemsテーブルに反映（INSERT OR REPLACE）
   *
   * @param items - R2から抽出したランキング項目情報の配列
   * @param dryRun - 実際の更新を行わず、変更内容をプレビューする
   * @returns 同期結果
   */
  static async syncToDatabase(
    items: R2RankingItemInfo[],
    dryRun: boolean = false
  ): Promise<SyncResult> {
    const db = getD1();
    const stats = {
      scanned: items.length,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [] as Array<{ rankingKey: string; error: string }>,
    };

    if (dryRun) {
      console.log(
        `[R2SyncService] DRY-RUN: ${items.length}件のrankingKeyを処理します`
      );
      // dry-runの場合、既存データを確認するだけ
      for (const item of items) {
        try {
          const existing = await db
            .prepare("SELECT ranking_key, unit, data_source_id FROM ranking_items WHERE ranking_key = ?")
            .bind(item.rankingKey)
            .first();

          if (existing) {
            console.log(
              `[R2SyncService] DRY-RUN: 更新予定 - ${item.rankingKey} (unit: ${existing.unit} → ${item.unit})`
            );
            stats.updated++;
          } else {
            console.log(
              `[R2SyncService] DRY-RUN: 作成予定 - ${item.rankingKey}`
            );
            stats.created++;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          stats.errors.push({
            rankingKey: item.rankingKey,
            error: errorMessage,
          });
          stats.skipped++;
        }
      }

      return {
        success: true,
        message: `DRY-RUN完了: スキャン${stats.scanned}件、作成予定${stats.created}件、更新予定${stats.updated}件、スキップ${stats.skipped}件`,
        stats,
      };
    }

    // 実際の更新処理
    for (const item of items) {
      try {
        // 既存データを確認（UPDATEでは既存データを保持するため、必要最小限の情報のみ取得）
        const existing = await db
          .prepare(
            `SELECT ranking_key, unit, data_source_id
             FROM ranking_items WHERE ranking_key = ?`
          )
          .bind(item.rankingKey)
          .first();

        if (existing) {
          // 既存データがある場合は、指定フィールドのみ更新
          // よりシンプルなUPDATE文を使用
          const result = await db
            .prepare(
              `UPDATE ranking_items 
               SET unit = ?, 
                   data_source_id = ?, 
                   updated_at = CURRENT_TIMESTAMP
               WHERE ranking_key = ?`
            )
            .bind(item.unit, item.dataSourceId, item.rankingKey)
            .run();

          if (result.success && result.meta && result.meta.changes > 0) {
            stats.updated++;
            console.log(
              `[R2SyncService] 更新完了: ${item.rankingKey} (unit: ${existing.unit} → ${item.unit}, data_source_id: ${existing.data_source_id} → ${item.dataSourceId})`
            );
          } else if (result.success && result.meta && result.meta.changes === 0) {
            // 更新対象がなかった場合（値が同じなど）
            console.log(
              `[R2SyncService] 更新スキップ: ${item.rankingKey} (値に変更なし)`
            );
            stats.skipped++;
          } else {
            throw new Error(
              `UPDATE処理が失敗しました: ${result.meta?.error || "unknown error"}`
            );
          }
        } else {
          // 新規作成
          // rankingKeyからlabelとnameを自動生成
          const label = item.rankingKey;
          const name = item.rankingKey
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // データベーススキーマに応じて必要なカラムのみを指定
          // group_key/group_idはNULLで良い（デフォルト値を使用）
          const result = await db
            .prepare(
              `INSERT INTO ranking_items 
               (ranking_key, label, name, description, unit, data_source_id,
                display_order_in_group, is_featured,
                map_color_scheme, map_diverging_midpoint, ranking_direction,
                conversion_factor, decimal_places, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            )
            .bind(
              item.rankingKey,
              label,
              name,
              null, // description
              item.unit,
              item.dataSourceId,
              0, // display_order_in_group
              0, // is_featured
              "interpolateBlues", // map_color_scheme
              "zero", // map_diverging_midpoint
              "desc", // ranking_direction
              1, // conversion_factor
              0 // decimal_places
            )
            .run();

          if (result.success) {
            stats.created++;
            console.log(
              `[R2SyncService] 作成完了: ${item.rankingKey} (unit: ${item.unit})`
            );
          } else {
            throw new Error("INSERT処理が失敗しました");
          }
        }
      } catch (error) {
        // より詳細なエラー情報を取得
        let errorMessage: string;
        let errorDetails: string | undefined;

        if (error instanceof Error) {
          errorMessage = error.message;
          errorDetails = error.stack;
          console.error(
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}`,
            {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          );
        } else if (typeof error === "object" && error !== null) {
          errorMessage = JSON.stringify(error);
          console.error(
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}`,
            error
          );
        } else {
          errorMessage = String(error);
          console.error(
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}`,
            error
          );
        }

        stats.errors.push({
          rankingKey: item.rankingKey,
          error: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
        });
        stats.skipped++;
      }
    }

    // R2に存在しないranking_keyのレコードを削除（data_source_id='estat'のみ対象）
    try {
      // R2から取得したranking_keyのセットを作成
      const r2RankingKeys = new Set(items.map((item) => item.rankingKey));

      // データベースからすべての'estat'ソースのranking_keyを取得
      const allEstatKeys = await db
        .prepare(
          `SELECT ranking_key FROM ranking_items WHERE data_source_id = 'estat'`
        )
        .all();

      const dbRankingKeys =
        (allEstatKeys.results as Array<{ ranking_key: string }>).map(
          (row) => row.ranking_key
        ) || [];

      // R2に存在しないranking_keyを抽出
      const orphanKeys = dbRankingKeys.filter(
        (key) => !r2RankingKeys.has(key)
      );

      if (orphanKeys.length > 0) {
        console.log(
          `[R2SyncService] R2に存在しないranking_keyを検出: ${orphanKeys.length}件`
        );
        console.log(
          `[R2SyncService] 削除対象: ${orphanKeys.slice(0, 10).join(", ")}${orphanKeys.length > 10 ? "..." : ""}`
        );

        if (dryRun) {
          console.log(
            `[R2SyncService] DRY-RUN: ${orphanKeys.length}件のranking_keyを削除予定`
          );
          stats.deleted = orphanKeys.length;
        } else {
          // 各orphanキーを削除
          for (const rankingKey of orphanKeys) {
            try {
              const deleteResult = await db
                .prepare(`DELETE FROM ranking_items WHERE ranking_key = ?`)
                .bind(rankingKey)
                .run();

              if (deleteResult.success && deleteResult.meta?.changes > 0) {
                stats.deleted++;
                console.log(
                  `[R2SyncService] 削除完了: ${rankingKey} (R2に存在しないため)`
                );
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              console.error(
                `[R2SyncService] 削除エラー: ${rankingKey}`,
                error
              );
              stats.errors.push({
                rankingKey,
                error: `削除失敗: ${errorMessage}`,
              });
              stats.skipped++;
            }
          }
        }
      } else {
        console.log(
          `[R2SyncService] R2に存在しないranking_keyはありません`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[R2SyncService] R2に存在しないranking_keyの削除処理でエラー:`,
        error
      );
      stats.errors.push({
        rankingKey: "orphan_keys_check",
        error: `削除処理エラー: ${errorMessage}`,
      });
    }

    return {
      success: stats.errors.length === 0,
      message: `同期完了: スキャン${stats.scanned}件、作成${stats.created}件、更新${stats.updated}件、削除${stats.deleted}件、スキップ${stats.skipped}件`,
      stats,
    };
  }

  /**
   * R2→D1同期処理を実行（完全版）
   *
   * @param areaType - 地域タイプ（指定がない場合は全地域タイプを走査）
   * @param dryRun - 実際の更新を行わず、変更内容をプレビューする
   * @returns 同期結果
   */
  static async syncR2ToDatabase(
    areaType?: "prefecture" | "city" | "national",
    dryRun: boolean = false
  ): Promise<SyncResult> {
    console.log(`[R2SyncService] 同期処理開始: areaType=${areaType || "all"}, dryRun=${dryRun}`);

    try {
      // 1. R2ディレクトリを走査
      const items = await this.scanRankingDirectory(areaType);
      console.log(`[R2SyncService] 走査完了: ${items.length}件のrankingKeyを検出`);

      if (items.length === 0) {
        // R2にデータがない場合でも、既存の'estat'ソースのデータを削除する必要がある
        // （R2が空になった場合に、古いデータを残さないため）
        const deleteResult = await this.syncToDatabase([], dryRun);
        return {
          success: deleteResult.success,
          message: deleteResult.message || "R2にランキングデータが見つかりませんでした",
          stats: deleteResult.stats,
        };
      }

      // 2. データベースに反映
      const result = await this.syncToDatabase(items, dryRun);

      console.log(`[R2SyncService] 同期処理完了: ${result.message}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[R2SyncService] 同期処理エラー:", error);

      return {
        success: false,
        message: `同期処理でエラーが発生しました: ${errorMessage}`,
        stats: {
          scanned: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [{ rankingKey: "unknown", error: errorMessage }],
        },
      };
    }
  }
}

