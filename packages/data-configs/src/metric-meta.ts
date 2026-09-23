import type { EntityKind, MetricConfig, YearSpec } from "./types";
import { listAllMetrics } from "./registry";

/**
 * Metric の派生メタ情報 (latestYear / availableYears / entities)。
 * Phase 7 で D1 stats_* SELECT を置換するための静的データソース。
 *
 * SQL fragment (旧 `latestYearSql` / `availableYearsSql`) や `exists(statsPrefecture)` の
 * 代替として、TS-config の `years` / `entities` から build-time に enumerate する。
 */
export interface MetricMeta {
  latestYear: { yearCode: string; yearName: string } | null;
  availableYears: { yearCode: string; yearName: string }[];
  entities: EntityKind[];
}

function yearName(yearCode: string): string {
  return `${yearCode}年度`;
}

function enumerateYears(spec: YearSpec): string[] {
  if (spec === "all") return [];
  if ("from" in spec) {
    const out: string[] = [];
    for (let y = spec.to; y >= spec.from; y--) out.push(String(y));
    return out;
  }
  if ("years" in spec) {
    return [...spec.years].map(String).sort((a, b) => b.localeCompare(a));
  }
  return [];
}

/**
 * yearCode (4桁) が config.years の範囲内か。ランキング (item/values) と相関が同じ年集合を見るための
 * 単一の判定 (以前は generate-ranking-items / generate-ranking-values に同一コードが複製されていた)。
 */
export function yearInSpec(yearCode: string, spec: YearSpec): boolean {
  if (spec === "all") return true;
  const y = parseInt(yearCode, 10);
  if (!Number.isFinite(y)) return false;
  if ("from" in spec) return y >= spec.from && y <= spec.to;
  if ("years" in spec) return spec.years.includes(y);
  return false;
}

function buildMeta(config: MetricConfig): MetricMeta {
  const years = enumerateYears(config.years);
  const availableYears = years.map((yearCode) => ({
    yearCode,
    yearName: yearName(yearCode),
  }));
  const latestYear =
    availableYears.length > 0
      ? availableYears[0]
      : null;

  return {
    latestYear,
    availableYears,
    entities: config.entities,
  };
}

let cachedMap: Map<string, MetricMeta> | null = null;

/**
 * 全 metric の派生メタ。初回呼び出し時に registry を walk して build。
 *
 * 注意: `years: "all"` の metric は availableYears が空配列になる。
 *       (元実装は stats_prefecture から動的計算していたが、R2 SSOT 化に伴い
 *        TS-config の `years` フィールドを SSOT とする方針。"all" のままでは
 *        年範囲が不明なので、可能な限り `years: { from, to }` に明示化することを推奨)
 */
export function getMetricMetaMap(): Map<string, MetricMeta> {
  if (cachedMap) return cachedMap;
  const map = new Map<string, MetricMeta>();
  for (const config of listAllMetrics()) {
    map.set(config.key, buildMeta(config));
  }
  cachedMap = map;
  return map;
}

export function getMetricMeta(key: string): MetricMeta | null {
  return getMetricMetaMap().get(key) ?? null;
}

/**
 * 指定の entityKind を含む全 metric の key を返す。
 * (旧 `exists(statsPrefecture) WHERE metric_key = metrics.key` の置換)
 */
export function listMetricKeysByEntity(entityKind: EntityKind): string[] {
  const out: string[] = [];
  for (const [key, meta] of getMetricMetaMap()) {
    if (meta.entities.includes(entityKind)) out.push(key);
  }
  return out;
}
