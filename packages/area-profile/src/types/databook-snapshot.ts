/**
 * AreaDatabook snapshot 型 — R2 `app/areas/<code>/databook.json` の構造。
 *
 * 県データブックの ranked-kpi / gender-paired ブロックが読む「値 + 全国順位」を
 * exporter (area-databook-snapshot.ts) が R2 values.json から焼き込んだもの。
 * 規約: `.claude/rules/area-databook-standards.md`
 */

/**
 * 県の「特徴」の選定に使う指標メタ (exporter が焼き込む)。
 *
 * 候補は AREA_DATABOOK_TEMPLATE の単一値指標だけ (collectHighlightCandidateKeys)。候補外の指標には付かない。
 * 選び方は packages/area-profile/src/highlights/select-area-highlights.ts だけが決める。
 */
export interface DatabookHighlightMeta {
  /** 表示ラベル (readerLabel ?? title に subtitle の修飾語を付けたもの) */
  label: string;
  /** item.json の生 subtitle */
  subtitle?: string;
  /** e-Stat 17 軸の categoryKey (分野重複の判定に使う) */
  category: string;
  /** 出典名 */
  source: string;
  /** 家計調査 (県庁所在市の値) か */
  isKakei: boolean;
  /** 決定力: 中央側の隣接順位との値の比 (両方正) または標準偏差で割った差。判定材料がなければ 0 */
  margin: number;
  /** 掲載価値スコア (0〜1、AREA_HIGHLIGHT_PROMINENCE)。未収載は 0 */
  prominence: number;
  /** METRIC_POLARITY で確定した極性。未確定は null */
  polarity: "higher-is-better" | "higher-is-worse" | "neutral" | null;
  /** 公開中のランキング (KNOWN_RANKING_KEYS) か */
  published: boolean;
  /** 順位が付いた県の数 (47 未満は部分集計) */
  rankedCount: number;
  /** 1 位が最大値 (desc) か最小値 (asc) か */
  rankDirection: "desc" | "asc";
}

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
  /** 県の「特徴」の候補メタ。schemaVersion 2 以降・候補指標のみ */
  highlight?: DatabookHighlightMeta;
}

/**
 * databook.json の版。2 = highlight メタを焼き込んだ版。
 * 1 (フィールド無し) の R2 を読んだ場合、選定は候補 0 件になる (再生成が必要)。
 */
export const AREA_DATABOOK_SCHEMA_VERSION = 2;

/** 農業産出額 上位品目 (Phase 3 で 生産農業所得統計から焼き込み)。 */
export interface DatabookAgriItem {
  name: string;
  value: number;
  unit: string;
}

/** 1 県の databook.json。 */
export interface AreaDatabookSnapshot {
  /** 版 (AREA_DATABOOK_SCHEMA_VERSION)。旧版は未設定 */
  schemaVersion?: number;
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

function parseHighlightMeta(key: string, meta: unknown): void {
  if (!isRecord(meta)) throw new Error(`metrics.${key}.highlight must be an object`);
  for (const field of ["label", "category", "source"] as const) {
    if (typeof meta[field] !== "string") throw new Error(`metrics.${key}.highlight.${field} must be a string`);
  }
  for (const field of ["margin", "prominence", "rankedCount"] as const) {
    if (!Number.isFinite(meta[field])) throw new Error(`metrics.${key}.highlight.${field} must be finite`);
  }
  if (typeof meta.isKakei !== "boolean" || typeof meta.published !== "boolean") {
    throw new Error(`metrics.${key}.highlight flags must be booleans`);
  }
  if (meta.rankDirection !== "desc" && meta.rankDirection !== "asc") {
    throw new Error(`metrics.${key}.highlight.rankDirection is invalid`);
  }
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
    if (metric.highlight !== undefined) parseHighlightMeta(key, metric.highlight);
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
    ...(typeof value.schemaVersion === "number" ? { schemaVersion: value.schemaVersion } : {}),
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
