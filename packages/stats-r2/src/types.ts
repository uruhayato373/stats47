import type { EntityKind, MetricRecipe } from "@stats47/data-configs";

/**
 * R2 keypath constants for stats data (Phase 6 architecture).
 *
 * Pattern: `app/stats/<metric>/<filename>`
 *
 * - prefecture stats: `app/stats/<metric>/values.json`           (全年 × 47 県)
 * - city stats:       `app/stats/<metric>/cities.json`           (全年 × 全市区町村)
 * - port stats:       `app/stats/<metric>/ports.json`            (全年 × 全港)
 * - migration-flow:   `app/stats/<metric>/migration-flow-<year>.json` (year 単位)
 */
export const STATS_R2_PREFIX = "app/stats";

export function statsR2Key(
  metricKey: string,
  entityKind: EntityKind,
  year?: number,
): string {
  switch (entityKind) {
    case "prefecture":
      return `${STATS_R2_PREFIX}/${metricKey}/values.json`;
    case "city":
      return `${STATS_R2_PREFIX}/${metricKey}/cities.json`;
    case "port":
      return `${STATS_R2_PREFIX}/${metricKey}/ports.json`;
    case "migration-flow":
      if (year == null)
        throw new Error("migration-flow requires year parameter");
      return `${STATS_R2_PREFIX}/${metricKey}/migration-flow-${year}.json`;
    default: {
      const _exhaustive: never = entityKind;
      throw new Error(`unknown entity kind: ${_exhaustive}`);
    }
  }
}

/** prefecture / city / port 共通: 1 観測 1 row */
export interface SingleEntityRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit?: string;
  rank?: number | null;
  /** city only */
  prefectureCode?: string;
  rankPref?: number | null;
}

export interface StatsValuesPayload {
  metricKey: string;
  entityKind: Exclude<EntityKind, "migration-flow">;
  rows: SingleEntityRow[];
  /** カバレッジ要約 */
  meta: {
    rowCount: number;
    yearRange: [string, string] | null;
    areaCount: number;
    generatedAt: string;
    /**
     * この値を書いた時点の config から機械生成した取得レシピ。
     *
     * 監査 (audit-ranking-data-integrity 検査 k) が `recipe.configHash` と現在の config の
     * hash を突き合わせ、ズレていれば R2 が stale と判定する。SSOT は git TS のままで、
     * これは検証つきの生成コピー。
     *
     * レシピ導入 (2026-07-30) より前に書かれた payload には無い。読み側は必ず optional
     * として扱い、監査だけが「未焼き込み (unbaked)」として残数を数える。
     */
    recipe?: MetricRecipe;
  };
}

/** migration-flow: ペア観測 */
export interface MigrationFlowRow {
  fromPrefCode: string;
  toPrefCode: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface MigrationFlowPayload {
  metricKey: string;
  entityKind: "migration-flow";
  year: number;
  rows: MigrationFlowRow[];
  meta: {
    rowCount: number;
    generatedAt: string;
  };
}

/**
 * 日本全国値の R2 namespace (GEO-SCOPE-SEPARATION-01 WP3)。
 *
 * `app/stats/<metric>/*.json` (47都道府県専用) とは独立した namespace。混在させない
 * (doc 43 §5: 「rank・47県配列・UI文言を保存しない」「既存 app/stats は47都道府県行のまま維持する」)。
 *
 * Pattern: `app/japan/<metric>/series.json`
 */
export const JAPAN_R2_PREFIX = "app/japan";

export function japanR2Key(metricKey: string): string {
  return `${JAPAN_R2_PREFIX}/${metricKey}/series.json`;
}

/** 日本全国値の由来。`resolveJapanValue` (data-configs/geo-scope) が判定する値と対応する。 */
export type JapanSourceMode = "official" | "derived-additive" | "derived-ratio";

export interface JapanSeriesRow {
  yearCode: string;
  yearName: string;
  value: number;
  unit: string;
}

export interface JapanSeriesArtifact {
  schemaVersion: 1;
  metricKey: string;
  geographyScope: "japan";
  sourceMode: JapanSourceMode;
  rows: JapanSeriesRow[];
  meta: {
    generatedAt: string;
    configHash: string;
    recipeHash: string;
    sourceId: string;
  };
}

/**
 * 国際比較値の R2 namespace 契約 (GEO-SCOPE-SEPARATION-01 WP7)。
 *
 * ★型のみ (doc 43 §7 WP7 step1「国際データ取得は別 backlog へ分離する」)。reader/writer/
 *   route は実装しない — 実データが 1 件も無い状態で消費経路だけ用意すると、
 *   将来 `readWorldValues()` を呼ぶコードが「404=null」と「未実装=null」を区別できず、
 *   静かに空描画するバグの温床になる。生成器・読者は `WORLD_CATALOGS`
 *   (`@stats47/data-configs/geo-scope`) が非空になった WP8 以降に、Japan (WP3) と
 *   同じ construction (fetch→schema parse→shape gate→reader/writer 同時実装) で追加する。
 *
 * `/japan` との違い: Japan は 47都道府県を 1 全国値に集約 (0/1行/年)。World は
 * 各国 (ISO コード) を横並びで比較する (N行/年、日本はその中の1行) — `/themes` の
 * 都道府県比較に近い形。この非対称性のため rows は国別複数行を持つ
 * (`app/stats/<metric>/values.json` の `SingleEntityRow` に近い形)。
 *
 * Pattern: `app/world/<metric>/values.json` (doc 43 §5 で確定済みの key 命名)
 */
export const WORLD_R2_PREFIX = "app/world";

export function worldR2Key(metricKey: string): string {
  return `${WORLD_R2_PREFIX}/${metricKey}/values.json`;
}

/** 国際値の由来。`WorldAvailability` (data-configs/geo-scope) が判定する値と対応する。 */
export type WorldSourceMode = "official" | "derived-additive" | "derived-ratio";

export interface WorldValueRow {
  /** ISO 3166-1 alpha-3 (例: "JPN")。都道府県コードの代わりに国を識別する。 */
  countryCode: string;
  countryName: string;
  yearCode: string;
  yearName: string;
  value: number;
  unit: string;
}

export interface WorldValuesArtifact {
  schemaVersion: 1;
  metricKey: string;
  geographyScope: "world";
  sourceMode: WorldSourceMode;
  /** どの国際機関から取得したか (doc 43 §5「ISO国コードと source provenance を持たせる」)。 */
  provider: "oecd" | "world-bank" | "un-data";
  rows: WorldValueRow[];
  meta: {
    generatedAt: string;
    configHash: string;
    recipeHash: string;
    sourceId: string;
  };
}
