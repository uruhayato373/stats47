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
