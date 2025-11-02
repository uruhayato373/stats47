import "server-only";

/**
 * R2→D1同期サービス
 *
 * R2ストレージのrankingディレクトリを走査し、ranking_itemsテーブルを自動生成・更新する機能を提供します。
 */

import { getD1 } from "@/infrastructure/database";
// estat-apiドメインのR2リポジトリを使用（ランキングデータの保存/取得はestat-apiの責務）
import { EstatRankingR2Repository } from "@/features/estat-api/ranking-mappings/repositories/rankingR2Repository";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * デフォルトのサブカテゴリID（「未分類」）
 */
const DEFAULT_SUBCATEGORY_ID = "uncategorized";

/**
 * R2から抽出したランキング項目情報
 */
export interface R2RankingItemInfo {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  unit: string;
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
   * ランキンググループが存在することを確認し、存在しない場合は作成する
   *
   * @param db - D1データベースインスタンス
   * @param groupKey - グループキー
   * @param groupName - グループ名（metadata.jsonのitemNameから取得）
   * @param label - ラベル（annotationから取得、NULL可）
   */
  private static async ensureGroupExists(
    db: D1Database,
    groupKey: string,
    groupName: string,
    label: string | null
  ): Promise<void> {
    try {
      // 既にグループが存在するか確認
      const existing = await db
        .prepare("SELECT group_key FROM ranking_groups WHERE group_key = ?")
        .bind(groupKey)
        .first();

      if (existing) {
        // 既に存在する場合は何もしない
        console.log(
          `[R2SyncService] グループは既に存在します: ${groupKey}`
        );
        return;
      }

      // グループが存在しない場合は作成
      const result = await db
        .prepare(
          `INSERT INTO ranking_groups 
           (group_key, group_name, label, display_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(groupKey, groupName, label, 0) // display_order
        .run();

      if (result.success) {
        // junction tableにデフォルトサブカテゴリを追加
        await db
          .prepare(
            `INSERT INTO ranking_group_subcategories
             (group_key, subcategory_id, display_order)
             VALUES (?, ?, ?)
             ON CONFLICT(group_key, subcategory_id) DO NOTHING`
          )
          .bind(groupKey, DEFAULT_SUBCATEGORY_ID, 0)
          .run();

        console.log(
          `[R2SyncService] グループを作成しました: ${groupKey} (group_name: ${groupName})`
        );
      } else {
        const errorDetail = result.meta?.error || result.error || "unknown error";
        console.error(
          `[R2SyncService] グループ作成失敗: ${groupKey}`,
          {
            groupKey,
            groupName,
            label,
            subcategoryId: DEFAULT_SUBCATEGORY_ID,
            error: errorDetail,
          }
        );
        throw new Error(
          `グループの作成に失敗しました: ${errorDetail} (group_key: ${groupKey}, subcategory_id: ${DEFAULT_SUBCATEGORY_ID})`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[R2SyncService] グループ作成エラー: ${groupKey}`,
        {
          groupKey,
          groupName,
          label,
          subcategoryId: DEFAULT_SUBCATEGORY_ID,
          error: errorMessage,
          originalError: error,
        }
      );
      throw new Error(
        `グループの作成に失敗しました: ${errorMessage} (group_key: ${groupKey}, subcategory_id: ${DEFAULT_SUBCATEGORY_ID})`
      );
    }
  }
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
    const processedKeys = new Set<string>(); // 重複排除用（areaType:rankingKey形式）

    for (const at of areaTypes) {
      try {
        // ranking/{areaType}/ のprefixでリストアップ
        const prefix = `ranking/${at}/`;
        const keys = await EstatRankingR2Repository.listRankingKeys(at);

        console.log(
          `[R2SyncService] ${at}ディレクトリから${keys.length}件のキーを検出`
        );

        // キーからrankingKeyを抽出
        // パターン: ranking/{areaType}/{rankingKey}/{yearCode}.json (yearCodeは4桁年度コード)
        const pattern = new RegExp(`^ranking/${at}/([^/]+)/([^/]+)\\.json$`);

        // キーをグループ化（同じrankingKeyのキーをまとめる）
        const rankingKeyMap = new Map<string, string[]>();

        for (const key of keys) {
          const match = key.match(pattern);
          if (!match) {
            console.warn(`[R2SyncService] パターンに一致しないキー: ${key}`);
            continue;
          }

          const [, rankingKey, timeCode] = match;

          if (!rankingKeyMap.has(rankingKey)) {
            rankingKeyMap.set(rankingKey, []);
          }
          rankingKeyMap.get(rankingKey)!.push(key);
        }

        console.log(
          `[R2SyncService] ${at}ディレクトリから${rankingKeyMap.size}件のユニークなrankingKeyを抽出`
        );

        // 各rankingKeyに対して処理（最初に見つかったファイルを使用）
        for (const [rankingKey, fileKeys] of rankingKeyMap.entries()) {
          // 既に処理済みのareaType:rankingKeyの組み合わせをスキップ
          // 異なるareaTypeでも同じrankingKeyは別レコードとして扱う
          const keyId = `${at}:${rankingKey}`;
          if (processedKeys.has(keyId)) {
            console.log(
              `[R2SyncService] 既に処理済み: ${keyId}（スキップ）`
            );
            continue;
          }

          // 最初のファイルを使用
          const key = fileKeys[0];

          try {
            // ファイルキーから年度コードを抽出（4桁形式を想定）
            const fileMatch = key.match(pattern);
            if (!fileMatch) continue;
            const [, , fileYearCode] = fileMatch;

            // 4桁年度コードを10桁timeCodeに変換（EstatRankingR2Repository.findRankingDataは10桁timeCodeを引数として受け取る）
            const timeCode = `${fileYearCode}000000`;

            // メタデータ抽出（1つのJSONファイルを読み取り）
            const statsSchemas = await EstatRankingR2Repository.findRankingData(
              at,
              rankingKey,
              timeCode
            );

            if (!statsSchemas || statsSchemas.length === 0) {
              console.warn(`[R2SyncService] データが空です: ${key}`);
              continue;
            }

            // unitを抽出（最初の要素から）
            const unit = statsSchemas[0]?.unit || "";

            if (!unit) {
              console.warn(`[R2SyncService] unitが取得できません: ${key}`);
              continue;
            }

            results.push({
              rankingKey,
              areaType: at,
              unit,
            });

            processedKeys.add(keyId);
            console.log(
              `[R2SyncService] ${at}ディレクトリから追加: ${rankingKey} (unit: ${unit})`
            );
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
            .prepare(
              "SELECT ranking_key, area_type, unit, group_key, ranking_name, annotation FROM ranking_items WHERE ranking_key = ? AND area_type = ?"
            )
            .bind(item.rankingKey, item.areaType)
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
        // metadata.jsonからitemNameとunitを取得
        const metadata = await EstatRankingR2Repository.findRankingMetadata(
          item.areaType,
          item.rankingKey
        );

        // metadata.jsonから値を取得（フォールバック値あり）
        const itemName = metadata?.itemName || item.rankingKey;
        const unitFromMetadata = metadata?.unit ?? item.unit;
        const label = itemName;
        const rankingName = itemName;

        // 既存データを確認（UPDATEでは既存データを保持するため、必要な情報を取得）
        const existing = await db
          .prepare(
            `SELECT ranking_key, area_type, unit, group_key, ranking_name, annotation
             FROM ranking_items WHERE ranking_key = ? AND area_type = ?`
          )
          .bind(item.rankingKey, item.areaType)
          .first<{
            ranking_key: string;
            area_type: string;
            unit: string;
            group_key: string | null;
            ranking_name: string;
            annotation: string | null;
          }>();

        if (existing) {
          // 既存データがある場合は、指定フィールドのみ更新
          // group_keyがNULLの場合、ranking_keyと同じ値を設定
          const groupKey = existing.group_key || item.rankingKey;

          // group_keyがNULLの場合、UPDATE文を実行する前にグループを作成する必要がある
          let shouldUpdateGroupKey = !existing.group_key;
          if (!existing.group_key) {
            try {
              await this.ensureGroupExists(
                db,
                groupKey,
                itemName, // metadata.jsonから取得したitemNameをgroup_nameに使用
                existing.annotation
              );
            } catch (groupError) {
              // グループ作成エラーは個別に記録して続行
              const groupErrorMessage =
                groupError instanceof Error
                  ? groupError.message
                  : String(groupError);
              console.error(
                `[R2SyncService] グループ作成エラー（続行）: ${groupKey}`,
                groupError
              );
              stats.errors.push({
                rankingKey: `${item.rankingKey}:${item.areaType}`,
                error: `グループ作成エラー: ${groupErrorMessage}`,
              });
              // エラーが発生した場合は、group_keyをNULLのまま更新を続行
              shouldUpdateGroupKey = false;
            }
          }

          // group_keyが変更される場合、UPDATE文に含める
          // metadata.jsonから取得した値でlabel, ranking_name, unitを更新
          const updateFields = shouldUpdateGroupKey
            ? `label = ?, ranking_name = ?, unit = ?, group_key = ?, updated_at = CURRENT_TIMESTAMP`
            : `label = ?, ranking_name = ?, unit = ?, updated_at = CURRENT_TIMESTAMP`;

          const bindValues = shouldUpdateGroupKey
            ? [label, rankingName, unitFromMetadata, groupKey, item.rankingKey, item.areaType]
            : [label, rankingName, unitFromMetadata, item.rankingKey, item.areaType];

          const result = await db
            .prepare(
              `UPDATE ranking_items 
               SET ${updateFields}
               WHERE ranking_key = ? AND area_type = ?`
            )
            .bind(...bindValues)
            .run();

          // エラーチェック: result.successがfalseの場合はエラー
          if (!result.success) {
            const errorDetail =
              result.error ||
              result.meta?.error ||
              "unknown error";
            const errorMessage =
              errorDetail instanceof Error
                ? errorDetail.message
                : typeof errorDetail === "string"
                  ? errorDetail
                  : JSON.stringify(errorDetail);
            throw new Error(
              `UPDATE処理が失敗しました: ${errorMessage} (ranking_key: ${item.rankingKey}, area_type: ${item.areaType})`
            );
          }

          if (result.meta && result.meta.changes > 0) {
            stats.updated++;
            console.log(
              `[R2SyncService] 更新完了: ${item.rankingKey}:${item.areaType} (label: ${existing.ranking_name} → ${label}, ranking_name: ${existing.ranking_name} → ${rankingName}, unit: ${existing.unit} → ${unitFromMetadata})`
            );
          } else if (result.meta && result.meta.changes === 0) {
            // 更新対象がなかった場合（値が同じなど）
            console.log(
              `[R2SyncService] 更新スキップ: ${item.rankingKey}:${item.areaType} (値に変更なし)`
            );
            stats.skipped++;
          } else {
            // result.metaがundefinedの場合もスキップとして扱う
            console.log(
              `[R2SyncService] 更新スキップ: ${item.rankingKey}:${item.areaType} (meta情報なし)`
            );
            stats.skipped++;
          }
        } else {
          // 新規作成
          // group_keyはranking_keyと同じ値を設定
          const groupKey = item.rankingKey;

          // INSERT前にグループを確実に作成（FOREIGN KEY制約を満たすため）
          let finalGroupKey = groupKey;
          try {
            await this.ensureGroupExists(db, groupKey, itemName, null); // metadata.jsonから取得したitemNameをgroup_nameに使用
          } catch (groupError) {
            // グループ作成エラーは記録して続行（NULLでINSERTを試みる）
            const groupErrorMessage =
              groupError instanceof Error
                ? groupError.message
                : String(groupError);
            console.error(
              `[R2SyncService] グループ作成エラー（続行）: ${groupKey}`,
              groupError
            );
            // groupKeyをnullにしてINSERTを試みる
            finalGroupKey = null;
            stats.errors.push({
              rankingKey: `${item.rankingKey}:${item.areaType}`,
              error: `グループ作成エラー: ${groupErrorMessage}`,
            });
          }

          // データベーススキーマに応じて必要なカラムのみを指定
          const result = await db
            .prepare(
              `INSERT INTO ranking_items 
               (ranking_key, area_type, label, ranking_name, annotation, unit,
                group_key, display_order_in_group,
                map_color_scheme, map_diverging_midpoint, ranking_direction,
                conversion_factor, decimal_places, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            )
            .bind(
              item.rankingKey,
              item.areaType,
              label, // metadata.jsonから取得したitemName
              rankingName, // metadata.jsonから取得したitemName
              null, // annotation
              unitFromMetadata, // metadata.jsonから取得したunit
              finalGroupKey, // group_key（グループ作成済みまたはnull）
              0, // display_order_in_group
              "interpolateBlues", // map_color_scheme
              "zero", // map_diverging_midpoint
              "desc", // ranking_direction
              1, // conversion_factor
              0, // decimal_places
              1 // is_active
            )
            .run();

          if (result.success) {
            stats.created++;
            console.log(
              `[R2SyncService] 作成完了: ${item.rankingKey}:${item.areaType} (label: ${label}, ranking_name: ${rankingName}, unit: ${unitFromMetadata})`
            );
          } else {
            const errorDetail =
              result.meta?.error ||
              result.error ||
              "unknown error";
            const errorInfo = {
              message: "INSERT処理が失敗しました",
              detail: errorDetail,
              rankingKey: item.rankingKey,
              areaType: item.areaType,
              unit: unitFromMetadata,
              meta: result.meta,
            };
            console.error(
              `[R2SyncService] INSERT失敗: ${item.rankingKey}:${item.areaType}`,
              errorInfo
            );
            throw new Error(
              `INSERT処理が失敗しました: ${errorDetail} (${item.rankingKey}:${item.areaType})`
            );
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
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}:${item.areaType}`,
            {
              message: error.message,
              stack: error.stack,
              name: error.name,
              rankingKey: item.rankingKey,
              areaType: item.areaType,
              unit: item.unit,
            }
          );
        } else if (typeof error === "object" && error !== null) {
          errorMessage = JSON.stringify(error);
          console.error(
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}:${item.areaType}`,
            {
              error,
              rankingKey: item.rankingKey,
              areaType: item.areaType,
              unit: item.unit,
            }
          );
        } else {
          errorMessage = String(error);
          console.error(
            `[R2SyncService] データベース反映エラー: ${item.rankingKey}:${item.areaType}`,
            {
              error,
              rankingKey: item.rankingKey,
              areaType: item.areaType,
              unit: item.unit,
            }
          );
        }

        stats.errors.push({
          rankingKey: `${item.rankingKey}:${item.areaType}`,
          error: errorDetails
            ? `${errorMessage}\n${errorDetails}`
            : errorMessage,
        });
        stats.skipped++;
      }
    }

    // R2に存在しないranking_keyのレコードを削除
    try {
      // R2から取得したranking_keyとarea_typeの組み合わせのセットを作成
      const r2RankingKeys = new Set(
        items.map((item) => `${item.rankingKey}:${item.areaType}`)
      );

      // データベースからすべてのranking_keyとarea_typeを取得
      const allEstatKeys = await db
        .prepare(`SELECT ranking_key, area_type FROM ranking_items`)
        .all();

      const dbRankingItems =
        (
          allEstatKeys.results as Array<{
            ranking_key: string;
            area_type: string;
          }>
        ).map((row) => ({
          rankingKey: row.ranking_key,
          areaType: row.area_type as "prefecture" | "city" | "national",
        })) || [];

      // R2に存在しないranking_keyとarea_typeの組み合わせを抽出
      const orphanItems = dbRankingItems.filter(
        (dbItem) =>
          !r2RankingKeys.has(`${dbItem.rankingKey}:${dbItem.areaType}`) &&
          // R2から取得したアイテムに一致するものが存在しないか確認
          !items.some(
            (r2Item) =>
              r2Item.rankingKey === dbItem.rankingKey &&
              r2Item.areaType === dbItem.areaType
          )
      );

      if (orphanItems.length > 0) {
        console.log(
          `[R2SyncService] R2に存在しないranking_keyを検出: ${orphanItems.length}件`
        );
        console.log(
          `[R2SyncService] 削除対象: ${orphanItems
            .slice(0, 10)
            .map((item) => `${item.rankingKey}:${item.areaType}`)
            .join(", ")}${orphanItems.length > 10 ? "..." : ""}`
        );

        if (dryRun) {
          console.log(
            `[R2SyncService] DRY-RUN: ${orphanItems.length}件のranking_keyを削除予定`
          );
          stats.deleted = orphanItems.length;
        } else {
          // 各orphanアイテムを削除
          for (const item of orphanItems) {
            try {
              const deleteResult = await db
                .prepare(
                  `DELETE FROM ranking_items WHERE ranking_key = ? AND area_type = ?`
                )
                .bind(item.rankingKey, item.areaType)
                .run();

              if (deleteResult.success && deleteResult.meta?.changes > 0) {
                stats.deleted++;
                console.log(
                  `[R2SyncService] 削除完了: ${item.rankingKey}:${item.areaType} (R2に存在しないため)`
                );
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              console.error(
                `[R2SyncService] 削除エラー: ${item.rankingKey}:${item.areaType}`,
                error
              );
              stats.errors.push({
                rankingKey: `${item.rankingKey}:${item.areaType}`,
                error: `削除失敗: ${errorMessage}`,
              });
              stats.skipped++;
            }
          }
        }
      } else {
        console.log(`[R2SyncService] R2に存在しないranking_keyはありません`);
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
    console.log(
      `[R2SyncService] 同期処理開始: areaType=${
        areaType || "all"
      }, dryRun=${dryRun}`
    );

    try {
      // 1. R2ディレクトリを走査
      const items = await this.scanRankingDirectory(areaType);
      console.log(
        `[R2SyncService] 走査完了: ${items.length}件のrankingKeyを検出`
      );

      if (items.length === 0) {
        // R2にデータがない場合でも、既存の'estat'ソースのデータを削除する必要がある
        // （R2が空になった場合に、古いデータを残さないため）
        const deleteResult = await this.syncToDatabase([], dryRun);
        return {
          success: deleteResult.success,
          message:
            deleteResult.message ||
            "R2にランキングデータが見つかりませんでした",
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
          deleted: 0,
          skipped: 0,
          errors: [{ rankingKey: "unknown", error: errorMessage }],
        },
      };
    }
  }
}

