import { fetchPrefectures } from "../repositories/fetch-prefectures";

/**
 * 地域コードを 2 桁の都道府県コードに正規化する。**2⇄5 桁変換の単一実装**。
 *
 * 5 桁（`"13000"` / 市区町村 `"13113"`）でも 2 桁（`"13"`）でも、
 * 先頭 2 桁を都道府県コードとして返す。プロジェクト規約（estat-api.md）では
 * 地域コードは 5 桁統一だが、UI セレクタ等で 2 桁を要する箇所のための正準変換。
 *
 * 先頭のゼロが落ちた表記も受ける (数値 `1` / `"1"` → `"01"`、数値 `1000` / `"1000"` → `"01"`)。
 * JSON の数値や topojson の id から来るコードを各所で独自に正規化させないため。
 *
 * @example
 * to2DigitPrefCode("13000"); // "13"
 * to2DigitPrefCode("13113"); // "13"
 * to2DigitPrefCode("13");    // "13"
 * to2DigitPrefCode(1000);    // "01"
 */
export function to2DigitPrefCode(code: string | number): string {
  const s = String(code).trim();
  if (s.length <= 2) return s.padStart(2, "0");
  // 4 桁 = 5 桁の先頭ゼロ落ち ("1000" = 01000)
  if (s.length === 4) return s.padStart(5, "0").slice(0, 2);
  return s.slice(0, 2);
}

/**
 * 地域コードを 5 桁の都道府県コードに正規化する。
 *
 * 2 桁（`"13"`）でも 5 桁（`"13000"` / 市区町村 `"13113"`）でも、
 * 先頭 2 桁 + `"000"` の 5 桁都道府県コードを返す。
 *
 * @example
 * to5DigitPrefCode("13");    // "13000"
 * to5DigitPrefCode("13113"); // "13000"
 * to5DigitPrefCode("13000"); // "13000"
 * to5DigitPrefCode(1);       // "01000"
 */
export function to5DigitPrefCode(code: string | number): string {
  return `${to2DigitPrefCode(code)}000`;
}

/**
 * 47 都道府県の「2 桁コード + 名称」一覧（UI セレクタ用）。
 *
 * `@stats47/area` の prefectures.json（5 桁 SSOT）から派生する単一ソース。
 * 各 feature が独自の 2 桁配列を再定義しないために提供する。
 */
export const PREFECTURE_LIST_2DIGIT: ReadonlyArray<{ code: string; name: string }> =
  fetchPrefectures().map((p) => ({
    code: to2DigitPrefCode(p.prefCode),
    name: p.prefName,
  }));
