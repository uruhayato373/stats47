import { JAPAN_NATIONAL_AREA_CODE, PREFECTURE_AREA_CODE_RE, type JapanAvailability } from "./types";

/** 集約前の1行 (areaCode + 値)。R2 正典 / e-Stat 応答どちらの最小共通形も満たす。 */
export interface AreaValueRow {
  areaCode: string;
  value: number | null;
}

export type JapanValueResult =
  | { ok: true; value: number; sourceMode: "official" | "derived-additive" | "derived-ratio" }
  | { ok: false; reason: string };

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * `JapanAvailability` に従って全国値を解決する (pure)。
 *
 * ★このファイルには「47都道府県の単純平均」を計算するコードを一切書かない
 *   (doc 43 §4 rule 4: 47県の単純平均・中央値・代表県・欠測を0へ変換した値を全国値にしない)。
 *   `official` は e-Stat の00000行だけを読み、無ければ失敗として扱う。`derived-additive` は
 *   47県が漏れなく揃っている場合の合計のみを許し、欠測があれば部分合計を返さず失敗する。
 *   `derived-ratio` は分子・分母を専用recipeが個別に扱う領域で、この汎用関数は常に失敗を返す
 *   (誤って平均・比の即席計算に転用されるのを防ぐ)。`unsupported` / `unknown` は理由付きで
 *   常に失敗し、0 やプレースホルダ値を作らない。
 */
export function resolveJapanValue(
  rows: AreaValueRow[],
  availability: JapanAvailability,
): JapanValueResult {
  switch (availability.status) {
    case "official": {
      const national = rows.find(
        (r) => r.areaCode === JAPAN_NATIONAL_AREA_CODE && isFiniteNumber(r.value),
      );
      if (!national) {
        return { ok: false, reason: "official指定だが有効な00000行が見つからない" };
      }
      return { ok: true, value: national.value as number, sourceMode: "official" };
    }
    case "derived-additive": {
      const prefRows = rows.filter((r) => PREFECTURE_AREA_CODE_RE.test(r.areaCode));
      const finite = prefRows.filter((r) => isFiniteNumber(r.value));
      if (finite.length !== 47) {
        return {
          ok: false,
          reason: `derived-additive (${availability.recipeKey}) は47県全件が必要 (${finite.length}/47 のみ有効)`,
        };
      }
      const sum = finite.reduce((acc, r) => acc + (r.value as number), 0);
      return { ok: true, value: sum, sourceMode: "derived-additive" };
    }
    case "derived-ratio":
      return {
        ok: false,
        reason: `derived-ratio (${availability.recipeKey}) は分子・分母を持つ専用recipeでのみ算出する。resolveJapanValue は計算しない`,
      };
    case "unsupported":
      return { ok: false, reason: `unsupported: ${availability.reason}` };
    case "unknown":
      return { ok: false, reason: "unknown: JapanAvailability が未確定のため値を作れない" };
  }
}
