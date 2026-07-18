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

export function areaDatabookKeyPath(areaCode: string): string {
  return `app/areas/${areaCode}/databook.json`;
}
