import "server-only";

import { collectTemplateMetricKeys, AREA_DATABOOK_TEMPLATE } from "@stats47/data-configs";
import { readRankingItemFromR2, listRankingValues } from "@stats47/ranking/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import type {
  AreaDatabookSnapshot,
  DatabookMetricValue,
} from "../types/databook-snapshot";
import { areaDatabookKeyPath } from "../types/databook-snapshot";

const AREA_TYPE = "prefecture";

export interface ExportAreaDatabookSnapshotResult {
  files: number;
  metricsResolved: number;
  metricsMissing: string[];
  totalSizeBytes: number;
  durationMs: number;
}

export interface BuildAreaDatabookOptions {
  /** 指定した県コードのみ計算する (dev の 1 県補完用)。未指定なら全 47 県。 */
  areaCodes?: string[];
}

/**
 * template が参照する指標の値+全国順位を R2 values.json から計算し、県ごとの snapshot を返す
 * (R2 へは書かない・pure)。exporter と dev の in-memory 補完で共有する。
 *
 * 農業産出額 上位品目 (agriTop10) は Phase 3 で 生産農業所得統計から焼き込む (現状は空配列)。
 */
export async function buildAreaDatabookSnapshots(
  opts: BuildAreaDatabookOptions = {},
): Promise<{ snapshots: AreaDatabookSnapshot[]; metricsResolved: number; metricsMissing: string[] }> {
  const templateKeys = collectTemplateMetricKeys(AREA_DATABOOK_TEMPLATE);
  const areaFilter = opts.areaCodes ? new Set(opts.areaCodes) : null;

  const byArea = new Map<string, { areaName: string; metrics: Record<string, DatabookMetricValue> }>();
  const metricsMissing: string[] = [];
  let metricsResolved = 0;

  // template が参照する 58 指標だけを per-key で読む (全 item を列挙しない)。
  for (const key of templateKeys) {
    const itemResult = await readRankingItemFromR2(key, AREA_TYPE);
    const item = itemResult.success ? itemResult.data : null;
    const yearCode = item?.latestYear?.yearCode;
    if (!item || !yearCode) {
      metricsMissing.push(key);
      continue;
    }
    const valuesResult = await listRankingValues(key, AREA_TYPE, yearCode);
    if (!valuesResult.success || valuesResult.data.length === 0) {
      metricsMissing.push(key);
      continue;
    }

    // 全国平均は全 47 県で算出する (area フィルタ前の全数)。
    const nums = valuesResult.data
      .map((rv) => rv.value)
      .filter((v): v is number => v !== null);
    const nationalAvg =
      nums.length > 0 ? nums.reduce((sum, v) => sum + v, 0) / nums.length : 0;

    for (const rv of valuesResult.data) {
      if (rv.value === null) continue;
      if (areaFilter && !areaFilter.has(rv.areaCode)) continue;
      const entry = byArea.get(rv.areaCode) ?? { areaName: rv.areaName, metrics: {} };
      entry.metrics[key] = {
        value: rv.value,
        rank: rv.rank,
        year: item.latestYear!.yearName,
        unit: item.unit,
        nationalAvg,
      };
      byArea.set(rv.areaCode, entry);
    }
    metricsResolved += 1;
  }

  const now = new Date().toISOString();
  const snapshots: AreaDatabookSnapshot[] = [...byArea.entries()].map(
    ([areaCode, entry]) => ({
      areaCode,
      areaName: entry.areaName,
      metrics: entry.metrics,
      agriTop10: [],
      generatedAt: now,
    }),
  );
  return { snapshots, metricsResolved, metricsMissing };
}

/**
 * 県データブック snapshot を R2 `app/areas/{areaCode}/databook.json` に保存する。
 *
 * 完全DBレス (area-profile-snapshot と同一パターン)。ページはこの 1 ファイルを 1 read するだけで
 * ranked-kpi / gender-paired グリッドを描画できる (estatParams ライブ取得は推移チャートのみ)。
 */
export async function exportAreaDatabookSnapshot(): Promise<ExportAreaDatabookSnapshotResult> {
  const startedAt = Date.now();
  const { snapshots, metricsResolved, metricsMissing } = await buildAreaDatabookSnapshots();

  let totalSizeBytes = 0;
  let files = 0;
  await Promise.all(
    snapshots.map(async (snapshot) => {
      const result = await saveToR2(
        areaDatabookKeyPath(snapshot.areaCode),
        JSON.stringify(snapshot),
        { contentType: "application/json; charset=utf-8" },
      );
      totalSizeBytes += result.size;
      files += 1;
    }),
  );

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files, metricsResolved, metricsMissing, totalSizeBytes, durationMs },
    "area_databook snapshot (完全DBレス) を R2 に保存しました",
  );
  return { files, metricsResolved, metricsMissing, totalSizeBytes, durationMs };
}
