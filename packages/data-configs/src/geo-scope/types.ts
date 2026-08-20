/**
 * 地理スコープ分離の型契約 (GEO-SCOPE-SEPARATION-01 WP1)。
 *
 * `docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md` §3.2 が定義する
 * `JapanAvailability` の実装。metric が日本全国値をどう扱えるかを判別可能 union で表す。
 * 自由記述の真偽値 (例: `hasNational: boolean`) を増やさず、この型だけを正とする。
 */
export type JapanAvailability =
  | { status: "official" }
  | { status: "derived-additive"; recipeKey: string }
  | { status: "derived-ratio"; recipeKey: string }
  | { status: "unsupported"; reason: string }
  | { status: "unknown" };

/** e-Stat の全国行 areaCode。 */
export const JAPAN_NATIONAL_AREA_CODE = "00000";

/** 都道府県コード (01000〜47000)。 */
export const PREFECTURE_AREA_CODE_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;
