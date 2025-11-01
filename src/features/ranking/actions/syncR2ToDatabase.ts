"use server";

/**
 * R2→D1同期アクション
 *
 * R2ストレージのrankingディレクトリを走査し、ranking_itemsテーブルを自動生成・更新します。
 */

import { R2SyncService } from "../services/r2-sync-service";
import type { SyncResult } from "../services/r2-sync-service";

/**
 * R2→D1同期処理を実行
 *
 * @param areaType - 地域タイプ（指定がない場合は全地域タイプを走査）
 * @param dryRun - 実際の更新を行わず、変更内容をプレビューする
 * @returns 同期結果
 */
export async function syncR2ToDatabaseAction(
  areaType?: "prefecture" | "city" | "national",
  dryRun: boolean = false
): Promise<SyncResult> {
  try {
    console.log(
      `[syncR2ToDatabaseAction] 同期実行開始: areaType=${areaType || "all"}, dryRun=${dryRun}`
    );

    const result = await R2SyncService.syncR2ToDatabase(areaType, dryRun);

    console.log(`[syncR2ToDatabaseAction] 同期実行完了: ${result.message}`);
    return result;
  } catch (error) {
    console.error("[syncR2ToDatabaseAction] 同期実行エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? `同期処理でエラーが発生しました: ${error.message}`
          : "同期処理でエラーが発生しました",
      stats: {
        scanned: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        errors: [
          {
            rankingKey: "unknown",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      },
    };
  }
}

