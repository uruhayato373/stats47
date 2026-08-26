/**
 * AreaDatabook snapshot 型 — R2 `app/areas/<code>/databook.json` の構造。
 *
 * 県データブックの ranked-kpi / gender-paired ブロックが読む「値 + 全国順位」を
 * exporter (area-databook-snapshot.ts) が R2 values.json から焼き込んだもの。
 * 規約: `.claude/rules/area-databook-standards.md`
 */

/** 1 指標の県データブック値 (自県の値 + 全国順位 + 全国平均)。 */
export interface DatabookMetricValue {
  /** 自県の観測値 */
  value: number;
  /** 全国順位 (1-47)。0/欠損は未ランク */
  rank: number;
  /** データ年度 (yearName、例 "2023年") */
  year: string;
  /** 単位 */
  unit: string;
  /** 全国平均 (全 47 県の非 null 値の平均)。compareNationalAvg 指標の対比用 */
  nationalAvg: number;
}

/** 農業産出額 上位品目 (Phase 3 で 生産農業所得統計から焼き込み)。 */
export interface DatabookAgriItem {
  name: string;
  value: number;
  unit: string;
}

/** 1 県の databook.json。 */
export interface AreaDatabookSnapshot {
  areaCode: string;
  areaName: string;
  /** rankingKey → 値+順位 (template が参照する指標のうち、その県で値がある分のみ) */
  metrics: Record<string, DatabookMetricValue>;
  /** 農業産出額 上位品目 (未整備の間は空配列) */
  agriTop10: DatabookAgriItem[];
  generatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAreaDatabookSnapshot(value: unknown): AreaDatabookSnapshot {
  if (!isRecord(value)) throw new Error("area databook must be an object");
  if (typeof value.areaCode !== "string" || typeof value.areaName !== "string") {
    throw new Error("area databook code and name must be strings");
  }
  if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error("area databook generatedAt must be a valid date string");
  }
  if (!isRecord(value.metrics)) throw new Error("area databook metrics must be an object");
  const metrics = Object.fromEntries(Object.entries(value.metrics).map(([key, metric]) => {
    if (!isRecord(metric)) throw new Error(`metrics.${key} must be an object`);
    for (const field of ["value", "rank", "nationalAvg"] as const) {
      if (!Number.isFinite(metric[field])) throw new Error(`metrics.${key}.${field} must be finite`);
    }
    if (typeof metric.year !== "string" || typeof metric.unit !== "string") {
      throw new Error(`metrics.${key} year and unit must be strings`);
    }
    return [key, metric as unknown as DatabookMetricValue];
  }));
  if (!Array.isArray(value.agriTop10)) throw new Error("area databook agriTop10 must be an array");
  const agriTop10 = value.agriTop10.map((item, index) => {
    if (!isRecord(item) || typeof item.name !== "string" || typeof item.unit !== "string" ||
      !Number.isFinite(item.value)) {
      throw new Error(`agriTop10[${index}] is schema-invalid`);
    }
    return item as unknown as DatabookAgriItem;
  });
  return {
    areaCode: value.areaCode,
    areaName: value.areaName,
    metrics,
    agriTop10,
    generatedAt: value.generatedAt,
  };
}

export function areaDatabookKeyPath(areaCode: string): string {
  return `app/areas/${areaCode}/databook.json`;
}
