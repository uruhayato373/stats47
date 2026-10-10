import "server-only";

import {
  collectTemplateMetricKeys,
  AREA_DATABOOK_TEMPLATE,
  METRIC_POLARITY,
} from "@stats47/data-configs";
import { AREA_HIGHLIGHT_PROMINENCE } from "@stats47/data-configs/ranking-prominence";
import { KNOWN_RANKING_KEYS } from "@stats47/ranking/config";
import { readRankingItemFromR2, listRankingValues } from "@stats47/ranking/server";
import { logger } from "@stats47/logger/server";
import { writeR2Staging } from "@stats47/r2-storage/server";

import { assertAreaHighlightsHealthy } from "../highlights/check-area-highlights";
import {
  buildQualifiedLabel,
  buildSubtitleQualifier,
  collectHighlightCandidateKeys,
  computeMargin,
  detectRankDirection,
} from "../highlights/select-area-highlights";
import type {
  AreaDatabookSnapshot,
  DatabookHighlightMeta,
  DatabookMetricValue,
} from "../types/databook-snapshot";
import { AREA_DATABOOK_SCHEMA_VERSION, areaDatabookKeyPath } from "../types/databook-snapshot";
import type { RankingItem } from "@stats47/ranking";

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
  const highlightKeys = new Set(collectHighlightCandidateKeys(AREA_DATABOOK_TEMPLATE));
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

    const ranked = valuesResult.data
      .filter((rv) => rv.value !== null && rv.rank >= 1)
      .map((rv) => ({ rank: rv.rank, value: rv.value as number }));
    const highlightBase = highlightKeys.has(key) ? buildHighlightBase(key, item, ranked) : null;

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
        ...(highlightBase
          ? { highlight: { ...highlightBase, margin: computeMargin(ranked, rv.rank) } }
          : {}),
      };
      byArea.set(rv.areaCode, entry);
    }
    metricsResolved += 1;
  }

  const now = new Date().toISOString();
  const snapshots: AreaDatabookSnapshot[] = [...byArea.entries()].map(
    ([areaCode, entry]) => ({
      schemaVersion: AREA_DATABOOK_SCHEMA_VERSION,
      areaCode,
      areaName: entry.areaName,
      metrics: entry.metrics,
      agriTop10: [],
      generatedAt: now,
    }),
  );
  return { snapshots, metricsResolved, metricsMissing };
}

/** item.json から県の「特徴」の候補メタ (県に依存しない部分) を作る。margin は県ごとに足す。 */
function buildHighlightBase(
  key: string,
  item: RankingItem,
  ranked: { rank: number; value: number }[],
): Omit<DatabookHighlightMeta, "margin"> {
  const isKakei = item.sourceConfig?.recipe?.kind === "kakei-chousa";
  const baseLabel = item.readerLabel || item.title || item.rankingName || key;
  const subtitle = item.subtitle || undefined;
  const source =
    item.source?.name ||
    item.attribution?.compilation?.name ||
    item.attribution?.originalSurveys?.[0]?.name ||
    "";
  return {
    label: buildQualifiedLabel(baseLabel, buildSubtitleQualifier(subtitle, isKakei)),
    ...(subtitle ? { subtitle } : {}),
    category: item.categoryKey ?? "",
    source,
    isKakei,
    prominence: AREA_HIGHLIGHT_PROMINENCE[key] ?? 0,
    polarity: METRIC_POLARITY[key]?.polarity ?? null,
    published: KNOWN_RANKING_KEYS.has(key),
    rankedCount: ranked.length,
    rankDirection: detectRankDirection(ranked),
  };
}

/**
 * 県データブック snapshot を R2 `app/areas/{areaCode}/databook.json` に保存する。
 *
 * 完全DBレス (R2 直接計算・使い捨て)。ページはこの 1 ファイルを 1 read するだけで
 * ranked-kpi / gender-paired グリッドを描画できる (estatParams ライブ取得は推移チャートのみ)。
 */
export async function exportAreaDatabookSnapshot(): Promise<ExportAreaDatabookSnapshotResult> {
  const startedAt = Date.now();
  const { snapshots, metricsResolved, metricsMissing } = await buildAreaDatabookSnapshots();
  // 生成直後に 47 県の「特徴」を検査し、違反があれば R2 へ 1 件も書かずに止める。
  assertAreaHighlightsHealthy(snapshots, { publishedKeys: KNOWN_RANKING_KEYS });

  let totalSizeBytes = 0;
  let files = 0;
  await Promise.all(
    snapshots.map(async (snapshot) => {
      const result = await writeR2Staging(
        areaDatabookKeyPath(snapshot.areaCode),
        JSON.stringify(snapshot),
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
