import "server-only";

import type { InsertAreaProfileRanking } from "@stats47/database/server";
import { listRankingItemsWithTags, listRankingValues } from "@stats47/ranking/server";
import { replaceAreaProfileRankings } from "../repositories/replace-area-profile-rankings";
import { buildAreaProfileRows, type AreaRankingData } from "../utils/build-area-profile-rows";
import type { BatchLog } from "../types";

/** 都道府県コード 01000〜47000 */
const AREA_CODES = Array.from({ length: 47 }, (_, i) =>
  `${String(i + 1).padStart(2, "0")}000`
);
const AREA_TYPE = "prefecture";
const MAX_ERROR_LOGS = 5;

/** バッチ処理のコールバック（ストア依存を排除） */
export interface BatchCallbacks {
  onLog: (log: BatchLog) => void;
  onRunning: (total: number) => void;
  onProgress: (completed: number, skipped: number, failed: number) => void;
  onComplete: (result: { success: boolean; message?: string; error?: string }) => void;
  isAborted: () => boolean;
  onAbortHandled: () => void;
}

export async function runBatchAreaProfile(callbacks: BatchCallbacks): Promise<void> {
  const { onLog, onRunning, onProgress, onComplete, isAborted, onAbortHandled } = callbacks;

  try {
    // --- 1. 全ランキング項目を取得 ---
    const itemsResult = await listRankingItemsWithTags({
      areaType: AREA_TYPE,
      isActive: true,
    });

    if (!itemsResult.success) {
      onLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: `ランキング項目の取得に失敗: ${itemsResult.error?.message ?? "不明"}`,
      });
      onComplete({
        success: false,
        error: itemsResult.error?.message ?? "データ取得エラー",
      });
      return;
    }

    const items = itemsResult.data.filter((item) => item.latestYear?.yearCode);
    if (items.length === 0) {
      onLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: "対象のランキング項目がありません",
      });
      onComplete({ success: true, message: "対象データなし" });
      return;
    }

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `ランキング項目 ${items.length} 件を取得しました`,
    });

    // --- 2. 各項目のデータを取得し、地域ごとに集約 ---
    const areaDataMap = new Map<string, AreaRankingData[]>();

    let fetchCount = 0;
    let emptyValueCount = 0;
    let errorValueCount = 0;
    for (const item of items) {
      if (isAborted()) break;

      const yearCode = item.latestYear!.yearCode;
      const valuesResult = await listRankingValues(
        item.rankingKey,
        AREA_TYPE,
        yearCode
      );

      if (!valuesResult.success) {
        errorValueCount++;
      } else if (valuesResult.data.length === 0) {
        emptyValueCount++;
      }

      if (valuesResult.success && valuesResult.data.length > 0) {
        for (const rv of valuesResult.data) {
          const list = areaDataMap.get(rv.areaCode) ?? [];
          list.push({
            rankingKey: item.rankingKey,
            indicator: item.title,
            year: item.latestYear!.yearName,
            rank: rv.rank,
            value: rv.value,
            unit: item.unit,
            areaName: rv.areaName,
          });
          areaDataMap.set(rv.areaCode, list);
        }
      }
      fetchCount++;
      if (fetchCount % 50 === 0) {
        onLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `データ取得中... (${fetchCount}/${items.length} 項目)`,
        });
      }
    }

    if (isAborted()) {
      onAbortHandled();
      onLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: "バッチ処理が中断されました（データ取得フェーズ）",
      });
      onComplete({ success: false, error: "中断されました" });
      return;
    }

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `データ集約完了。${fetchCount} 項目取得（空: ${emptyValueCount}, エラー: ${errorValueCount}）、${areaDataMap.size} 地域にデータあり。地域別保存を開始します。`,
    });

    // --- 3. 地域ごとに強み・弱みを判定して保存 ---
    const total = AREA_CODES.length;
    onRunning(total);

    let completed = 0;
    let skipped = 0;
    let failed = 0;

    for (const areaCode of AREA_CODES) {
      if (isAborted()) break;

      const dataList = areaDataMap.get(areaCode);
      if (!dataList || dataList.length === 0) {
        skipped++;
        onProgress(completed, skipped, failed);
        continue;
      }

      try {
        const now = new Date().toISOString();
        const areaName = dataList[0].areaName;
        const rows = buildAreaProfileRows(areaCode, areaName, dataList, now) as InsertAreaProfileRanking[];

        await replaceAreaProfileRankings(areaCode, rows);
        completed++;
      } catch (err) {
        failed++;
        if (failed <= MAX_ERROR_LOGS) {
          onLog({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `[${areaCode}] プロファイル保存失敗: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }
      onProgress(completed, skipped, failed);
    }

    const wasAborted = isAborted();
    onAbortHandled();

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: wasAborted ? "バッチ処理を中断しました。" : "バッチ処理が完了しました。",
    });

    onComplete({
      success: true,
      message: wasAborted ? "中断されました" : `完了: ${completed}件, 失敗: ${failed}件`,
    });
  } catch (err) {
    onAbortHandled();
    onLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message: `予期せぬエラー: ${err instanceof Error ? err.message : String(err)}`,
    });
    onComplete({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
