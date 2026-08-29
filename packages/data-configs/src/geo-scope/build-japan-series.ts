import { resolveJapanValue, type AreaValueRow } from "./resolve-japan-value";
import {
  JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
  JAPAN_NATIONAL_AREA_CODE,
  PREFECTURE_AREA_CODE_RE,
} from "./types";
import { parseUnit } from "../unit/unit-semantics";

/** e-Stat から取得した 00000 (全国) 行の最小形。writer はこれだけを渡す (pure)。 */
export interface EstatNationalRow {
  yearCode: string;
  yearName: string;
  value: number | null;
  unit?: string | null;
}

/** `app/stats/<metric>/values.json` の都道府県行から加算全国値を作るための最小形。 */
export interface PrefectureSeriesSourceRow {
  areaCode: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit?: string | null;
}

export interface JapanSeriesRowResult {
  yearCode: string;
  yearName: string;
  value: number;
  unit: string;
}

export type BuildJapanSeriesResult =
  | {
      ok: true;
      rows: JapanSeriesRowResult[];
      rejectedYears: { yearCode: string; reason: string }[];
    }
  | { ok: false; reason: string };

/**
 * e-Stat の 00000 行群 (複数年) から `JapanSeriesArtifact.rows` を組み立てる (pure)。
 *
 * ★official 専用 (derived-additive/derived-ratio は年ごとに異なる入力形が要るため対象外)。
 * ★config.unit と e-Stat 応答の unit が食い違う年があれば全体を停止する (doc 43 §11:
 *   単位が一致しない場合は推測で進めず停止する)。1 年だけ捨てて残りを書く、はしない
 *   (部分的に正しいデータより、全体が疑わしいと分かる方が安全)。
 * ★比較は `unit-semantics.ts` の NFKC 正規化を通す (全半角ゆれ「ｋｍ」↔「km」を
 *   誤って不一致と判定しないため。WP6 実測で road-*-length の2 metric がこれで
 *   誤って unsupported 判定されていた)。プレースホルダ ('‐' 等、意味的に異なる単位) は
 *   NFKC 正規化しても一致しないため引き続き不一致=停止のまま (安全側は変えない)。
 * ★年ごとの値は `resolveJapanValue` (official) を通す。プレースホルダ値 ('-' 等が
 *   convertToStatsSchema で null 化されたもの) はその年だけ rejectedYears へ回し、
 *   他の年は活かす (2026-08-20 の実例: 県内大学進学率は全年 '-' で 0 行、他 metric は
 *   一部年だけ欠測というケースを想定)。
 */
export function buildJapanSeriesRows(
  nationalRows: EstatNationalRow[],
  expectedUnit: string,
): BuildJapanSeriesResult {
  if (nationalRows.length === 0) {
    return { ok: false, reason: "00000 (全国) 行が1件もない" };
  }

  const expectedNormalized = parseUnit(expectedUnit).normalized;
  const mismatched = nationalRows.find(
    (r) => r.unit != null && parseUnit(r.unit).normalized !== expectedNormalized,
  );
  if (mismatched) {
    return {
      ok: false,
      reason: `単位不一致: config.unit='${expectedUnit}' / e-Stat unit='${mismatched.unit}' (year=${mismatched.yearCode})`,
    };
  }

  const byYear = new Map<string, { yearName: string; rows: AreaValueRow[] }>();
  for (const r of nationalRows) {
    const entry = byYear.get(r.yearCode) ?? { yearName: r.yearName, rows: [] };
    entry.rows.push({ areaCode: JAPAN_NATIONAL_AREA_CODE, value: r.value });
    byYear.set(r.yearCode, entry);
  }

  const rows: JapanSeriesRowResult[] = [];
  const rejectedYears: { yearCode: string; reason: string }[] = [];
  for (const [yearCode, { yearName, rows: areaRows }] of [...byYear.entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    const result = resolveJapanValue(areaRows, { status: "official" });
    if (!result.ok) {
      rejectedYears.push({ yearCode, reason: result.reason });
      continue;
    }
    rows.push({ yearCode, yearName, value: result.value, unit: expectedUnit });
  }

  return { ok: true, rows, rejectedYears };
}

/**
 * 同一年の47都道府県実数を合計して `derived-additive` の全国系列を作る。
 *
 * 47コードの重複・単位不一致はartifact全体を停止する。欠測を含む年は0埋めせず
 * rejectedYearsへ回す。47県の単純平均は作らず、呼び出し側が採用済みrecipeを
 * 明示したmetricにだけ使う。
 */
export function buildDerivedAdditiveJapanSeriesRows(
  prefectureRows: PrefectureSeriesSourceRow[],
  expectedUnit: string,
): BuildJapanSeriesResult {
  if (prefectureRows.length === 0) {
    return { ok: false, reason: "都道府県行が1件もない" };
  }

  const expectedNormalized = parseUnit(expectedUnit).normalized;
  const mismatched = prefectureRows.find(
    (row) => row.unit != null && parseUnit(row.unit).normalized !== expectedNormalized,
  );
  if (mismatched) {
    return {
      ok: false,
      reason: `単位不一致: config.unit='${expectedUnit}' / source unit='${mismatched.unit}' (year=${mismatched.yearCode})`,
    };
  }

  const byYear = new Map<string, PrefectureSeriesSourceRow[]>();
  for (const row of prefectureRows) {
    if (!PREFECTURE_AREA_CODE_RE.test(row.areaCode)) {
      return {
        ok: false,
        reason: `都道府県コードではない行を含む: ${row.areaCode} (year=${row.yearCode})`,
      };
    }
    const rows = byYear.get(row.yearCode) ?? [];
    rows.push(row);
    byYear.set(row.yearCode, rows);
  }

  const rows: JapanSeriesRowResult[] = [];
  const rejectedYears: { yearCode: string; reason: string }[] = [];
  for (const [yearCode, sourceRows] of [...byYear.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const areaCodes = new Set(sourceRows.map((row) => row.areaCode));
    if (areaCodes.size !== sourceRows.length) {
      return { ok: false, reason: `${yearCode}: 都道府県コードが重複している` };
    }
    const yearNames = new Set(sourceRows.map((row) => row.yearName));
    if (yearNames.size !== 1) {
      return { ok: false, reason: `${yearCode}: yearName が一致しない` };
    }

    const result = resolveJapanValue(
      sourceRows.map((row) => ({ areaCode: row.areaCode, value: row.value })),
      { status: "derived-additive", recipeKey: JAPAN_DERIVED_ADDITIVE_RECIPE_KEY },
    );
    if (!result.ok) {
      rejectedYears.push({ yearCode, reason: result.reason });
      continue;
    }
    rows.push({
      yearCode,
      yearName: sourceRows[0].yearName,
      value: result.value,
      unit: expectedUnit,
    });
  }

  return { ok: true, rows, rejectedYears };
}
