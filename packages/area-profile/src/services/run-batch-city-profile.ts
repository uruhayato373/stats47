import "server-only";

import { sql } from "drizzle-orm";

import { cities, getDrizzle, statsCity } from "@stats47/database/server";

import {
  replaceCityProfileRankings,
  type CityProfileWriteRow,
} from "../repositories/replace-city-profile-rankings";
import {
  buildCityProfileRows,
  type CityRankingData,
} from "../utils/build-city-profile-rows";

import type { BatchLog } from "../types";

/** バッチ処理のコールバック (prefecture batch と同じ interface) */
export interface BatchCallbacks {
  onLog: (log: BatchLog) => void;
  onRunning: (total: number) => void;
  onProgress: (completed: number, skipped: number, failed: number) => void;
  onComplete: (result: { success: boolean; message?: string; error?: string }) => void;
  isAborted: () => boolean;
  onAbortHandled: () => void;
}

/**
 * 市区町村ごとの強み (上位 5) を area_profiles テーブルに保存するバッチ。
 *
 * Phase 1 MVP:
 * - stats_city テーブルから「県内ランク (rank_pref) <= 5」のレコードを各市区町村別に集約
 * - rank=0 等のデータ欠損は extractStrengthsAndWeaknesses が自動 filter
 * - 各 city の最新年度のみ採用 (異なる metric は異なる年度を持つので metric ごとに最新)
 * - 弱みは未生成 (Phase 1 後半で検討)
 *
 * 想定実行時間: 2,701 cities × ~100 metrics 平均 = ~5-10 秒 (prefecture batch と同等)
 */
export async function runBatchCityProfile(callbacks: BatchCallbacks): Promise<void> {
  const { onLog, onRunning, onProgress, onComplete, isAborted, onAbortHandled } = callbacks;

  try {
    const db = getDrizzle();

    // --- 1. 全 city のリストを取得 ---
    const cityRows = await db
      .select({ code: cities.code, name: cities.name })
      .from(cities)
      .where(sql`is_active = 1`);

    if (cityRows.length === 0) {
      onLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: "対象の市区町村がありません (cities テーブル空)",
      });
      onComplete({ success: true, message: "対象データなし" });
      return;
    }

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `市区町村 ${cityRows.length} 件を取得しました`,
    });

    // --- 2. stats_city から各 city の最新年度 metric データを集約 ---
    // 各 (areaCode, metricKey) で最新の yearCode のみ取得
    // 大量データ (1.87M 行) のため、city ごとに subquery で最新年度を絞る
    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "stats_city から最新年度データを取得中…",
    });

    // 最新年度 per (area_code, metric_key) を取得 (rank_pref が非 NULL のもののみ)
    const allStatsRows = (await db.all(sql`
      SELECT s.area_code, s.area_name, s.metric_key, s.year_code, s.year_name,
             s.value, s.unit, s.rank, s.rank_pref,
             m.title AS indicator_title
      FROM stats_city s
      INNER JOIN (
        SELECT area_code, metric_key, MAX(year_code) AS max_year
        FROM stats_city
        WHERE rank_pref IS NOT NULL
        GROUP BY area_code, metric_key
      ) latest
        ON s.area_code = latest.area_code
        AND s.metric_key = latest.metric_key
        AND s.year_code = latest.max_year
      INNER JOIN metrics m ON m.key = s.metric_key
      WHERE m.is_active = 1
        AND s.rank_pref IS NOT NULL
        AND s.rank_pref >= 1
        AND s.rank_pref <= 5
    `)) as Array<{
      area_code: string;
      area_name: string;
      metric_key: string;
      year_code: string;
      year_name: string;
      value: number | null;
      unit: string;
      rank: number | null;
      rank_pref: number;
      indicator_title: string;
    }>;

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `県内 top 5 候補 ${allStatsRows.length} 件抽出`,
    });

    // --- 3. city ごとに集約 ---
    const cityDataMap = new Map<string, CityRankingData[]>();
    for (const row of allStatsRows) {
      if (row.value === null) continue;
      const list = cityDataMap.get(row.area_code) ?? [];
      list.push({
        rankingKey: row.metric_key,
        indicator: row.indicator_title,
        year: row.year_name || row.year_code,
        rankPref: row.rank_pref,
        rankNational: row.rank ?? 0,
        value: row.value,
        unit: row.unit,
        areaName: row.area_name,
      });
      cityDataMap.set(row.area_code, list);
    }

    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `集約完了。${cityDataMap.size} cities に強み候補あり`,
    });

    // --- 4. 各 city について profile rows を生成して保存 ---
    const total = cityRows.length;
    onRunning(total);

    let completed = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ areaCode: string; error: string }> = [];

    for (const city of cityRows) {
      if (isAborted()) break;

      const dataList = cityDataMap.get(city.code);
      if (!dataList || dataList.length === 0) {
        skipped++;
        if (skipped % 200 === 0) onProgress(completed, skipped, failed);
        continue;
      }

      try {
        const now = new Date().toISOString();
        const rows = buildCityProfileRows(city.code, city.name, dataList, now) as CityProfileWriteRow[];
        await replaceCityProfileRankings(city.code, rows);
        completed++;
        if (completed % 100 === 0) onProgress(completed, skipped, failed);
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        if (errors.length < 5) errors.push({ areaCode: city.code, error: msg });
      }
    }

    if (isAborted()) {
      onAbortHandled();
      onLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: "バッチ処理が中断されました",
      });
      onComplete({ success: false, error: "中断されました" });
      return;
    }

    if (errors.length > 0) {
      for (const e of errors) {
        onLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: `${e.areaCode}: ${e.error}`,
        });
      }
    }

    onProgress(completed, skipped, failed);
    onLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `バッチ処理が完了しました。完了 ${completed} / スキップ ${skipped} / 失敗 ${failed}`,
    });
    onComplete({
      success: true,
      message: `完了: ${completed} 件, スキップ: ${skipped} 件, 失敗: ${failed} 件`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message: `バッチ処理失敗: ${msg}`,
    });
    onComplete({ success: false, error: msg });
  }
}
