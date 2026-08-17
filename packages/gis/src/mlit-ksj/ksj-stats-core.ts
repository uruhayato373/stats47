/**
 * KSJ feature 群 → `app/stats/<metric>/values.json` の純関数。
 *
 * 行の形・rank 規則・ソート順は取り込みの正典 `page-data-batch.ts` に合わせる
 * (別実装で微妙に違う payload を作らない)。`calculated-stats-core.ts` と同じ方針。
 *
 * ## 未解決を握り潰さない
 *
 * 県を決められなかった feature は `unresolved` に積んで返す。呼び出し側は件数を必ず
 * 表に出し、0 でなければ書き込みを止めること。旧実装の事故はまさに「決められないので
 * 近い県にした」であり、黙って別の県へ計上するのが最悪の失敗にあたる。
 */

import type { SingleEntityRow, StatsValuesPayload } from "@stats47/stats-r2/types";

import {
  PREF_CODES,
  PREF_NAME_BY_CODE,
  type PrefectureLocator,
  type PrefectureSource,
  resolvePrefecture,
} from "./prefecture-assign";

export interface KsjPointFeature {
  readonly properties: Readonly<Record<string, unknown>> | null;
  /** 代表点。Point 以外は呼び出し側が代表点を決めて渡す */
  readonly coord: readonly [number, number] | null;
}

export interface PrefectureCountResult {
  /** 2 桁県コード → 件数 (47 県すべてを 0 で初期化済み) */
  readonly countsByPref: ReadonlyMap<string, number>;
  readonly resolvedByAttribute: number;
  readonly resolvedByPolygon: number;
  /** 県を決められなかった feature。件数 0 でなければ書き込みを止める */
  readonly unresolved: readonly KsjPointFeature[];
}

export function countByPrefecture(
  features: Iterable<KsjPointFeature>,
  options: {
    readonly source?: PrefectureSource | null;
    readonly locator?: PrefectureLocator | null;
  },
): PrefectureCountResult {
  const counts = new Map<string, number>(PREF_CODES.map((c) => [c, 0]));
  const unresolved: KsjPointFeature[] = [];
  let byAttribute = 0;
  let byPolygon = 0;

  for (const f of features) {
    const hit = resolvePrefecture({
      properties: f.properties,
      source: options.source ?? null,
      coord: f.coord,
      locator: options.locator ?? null,
    });
    if (!hit) {
      unresolved.push(f);
      continue;
    }
    counts.set(hit.prefCode, (counts.get(hit.prefCode) ?? 0) + 1);
    if (hit.method === "attribute") byAttribute++;
    else byPolygon++;
  }

  return {
    countsByPref: counts,
    resolvedByAttribute: byAttribute,
    resolvedByPolygon: byPolygon,
    unresolved,
  };
}

/**
 * 年ごとに value 降順で rank 付与。null は rank null、同値は同順位。
 *
 * `page-data-batch.ts` / `calculated-stats-core.ts` と同一規則。3 箇所に同じ規則の
 * 実装が並んでいるので、共有化は `docs/todo/05_機能バックログ.md` の
 * `KSJ-PREF-ASSIGN-01` で追う。
 */
function assignRanks(rows: SingleEntityRow[]): void {
  const byYear = new Map<string, SingleEntityRow[]>();
  for (const r of rows) {
    const group = byYear.get(r.yearCode);
    if (group) group.push(r);
    else byYear.set(r.yearCode, [r]);
  }
  for (const group of byYear.values()) {
    const ranked = group
      .filter((r) => r.value != null)
      .sort((a, b) => (b.value as number) - (a.value as number));
    let prevValue: number | null = null;
    let prevRank = 0;
    ranked.forEach((r, i) => {
      if (prevValue !== null && r.value === prevValue) {
        r.rank = prevRank;
      } else {
        r.rank = i + 1;
        prevRank = i + 1;
        prevValue = r.value;
      }
    });
  }
}

export function buildStatsPayload(args: {
  readonly metricKey: string;
  readonly unit: string;
  readonly yearCode: string;
  readonly countsByPref: ReadonlyMap<string, number>;
  readonly generatedAt: string;
  readonly recipe?: StatsValuesPayload["meta"]["recipe"];
}): StatsValuesPayload {
  const { metricKey, unit, yearCode, countsByPref, generatedAt, recipe } = args;

  const rows: SingleEntityRow[] = PREF_CODES.map((code) => ({
    areaCode: `${code}000`,
    areaName: PREF_NAME_BY_CODE[code],
    yearCode,
    yearName: `${yearCode}年`,
    value: countsByPref.get(code) ?? 0,
    unit,
    rank: null,
  }));
  assignRanks(rows);

  return {
    metricKey,
    entityKind: "prefecture",
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: [yearCode, yearCode],
      areaCount: rows.length,
      generatedAt,
      ...(recipe ? { recipe } : {}),
    },
  };
}
