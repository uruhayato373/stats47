/**
 * 地域コードの変換と判定の単一実装 (台帳を読まない葉のモジュール)。
 *
 * 都道府県は 5 桁 ("01000"〜"47000")、市区町村は 5 桁 ("13113")、全国は "00000"。
 * 2 桁 ("13") は UI と地図の形データ (TopoJSON の N03_007) が使う。
 * このファイルは prefectures.json を import しないので、ブラウザ向けの部品と Remotion も
 * `@stats47/area/area-code` から読んで台帳を束に入れずに済む。root の入口 (`@stats47/area`) も全部を再 export する。
 *
 * 呼び出し側で `code.slice(0, 2)`・`` `${pref}000` ``・`/^\d{2}000$/`・`"00000"`・`47` を書かない。
 * 写しは `packages/area/scripts/check-area-year-entrypoint.mjs` が数える。
 * Node のスクリプト用の鏡は `.claude/scripts/lib/prefectures.cjs` (同じ入力で結果が一致することをテストで固定)。
 */

/** e-Stat の全国行 areaCode。 */
export const NATIONAL_AREA_CODE = "00000";

/** 都道府県の数。台帳 (prefectures.json) の件数と一致することをテストで固定している。 */
export const PREFECTURE_COUNT = 47;

/** 都道府県の 5 桁コード (01000〜47000)。 */
export const PREFECTURE_AREA_CODE_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

/** 全国 (00000) または都道府県の 5 桁コード。 */
export const NATIONAL_OR_PREFECTURE_AREA_CODE_RE = /^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/;

/** 都道府県の 2 桁コード (01〜47)。 */
export const PREFECTURE_CODE_2DIGIT_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])$/;

/**
 * 地域コードを 2 桁の都道府県コードに正規化する。**2⇄5 桁変換の単一実装**。
 *
 * 5 桁 (`"13000"` / 市区町村 `"13113"`) でも 2 桁 (`"13"`) でも、先頭 2 桁を都道府県コードとして返す。
 * 先頭のゼロが落ちた表記も受ける (数値 `1` / `"1"` → `"01"`、数値 `1000` / `"1000"` → `"01"`)。
 *
 * @example
 * to2DigitPrefCode("13000"); // "13"
 * to2DigitPrefCode("13113"); // "13"
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
 * 地域コードを 5 桁の都道府県コードに正規化する。市区町村コードなら所属する県のコードになる。
 *
 * @example
 * to5DigitPrefCode("13");    // "13000"
 * to5DigitPrefCode("13113"); // "13000"
 * to5DigitPrefCode(1);       // "01000"
 */
export function to5DigitPrefCode(code: string | number): string {
  return `${to2DigitPrefCode(code)}000`;
}

/** 市区町村コード (または県コード) が属する都道府県の 5 桁コード。`to5DigitPrefCode` の、意図を名前にした別名。 */
export function prefectureAreaCodeOf(code: string | number): string {
  return to5DigitPrefCode(code);
}

/**
 * 5 桁の地域コードから 2 桁の都道府県コードを取り出す。2 桁未満は null。
 *
 * @example
 * extractPrefectureCode("13113"); // "13"
 * extractPrefectureCode("");      // null
 */
export function extractPrefectureCode(areaCode: string): string | null {
  if (!areaCode || areaCode.length < 2) return null;
  return areaCode.substring(0, 2);
}

/** 全国の行 ("00000") か。 */
export function isNationalAreaCode(code: string | number): boolean {
  return String(code).trim() === NATIONAL_AREA_CODE;
}

/** 都道府県の 5 桁コード (01〜47) か。全国の行は含まない。 */
export function isPrefectureAreaCode(code: string): boolean {
  return PREFECTURE_AREA_CODE_RE.test(code);
}

/** 市区町村コードの形か (5 桁・先頭 2 桁が 01〜47・末尾が 000 でない)。今の市区町村の一覧に在るかは見ない。 */
export function isCityAreaCode(code: string): boolean {
  return /^\d{5}$/.test(code) && PREFECTURE_CODE_2DIGIT_RE.test(code.slice(0, 2)) && !code.endsWith("000");
}

/**
 * 地域コードが沖縄県 (都道府県コード 47、市区町村 `"47201"` を含む) かどうか。
 *
 * @example
 * isOkinawaAreaCode("47000"); // true
 * isOkinawaAreaCode(47);      // true
 */
export function isOkinawaAreaCode(code: string | number): boolean {
  return to2DigitPrefCode(code) === "47";
}

/**
 * 地図の形データ (TopoJSON / GeoJSON の properties) から 2 桁の都道府県コードを読む。
 * 国土数値情報の行政区域 (N03_007) と、自前の形データの prefCode・code・id の順に見る。
 * 市区町村の形データ (N03_007 が 5 桁) なら所属する県のコードになる。読めなければ null。
 */
export function prefCodeFromTopoProperties(
  properties: Readonly<Record<string, unknown>> | null | undefined,
): string | null {
  const raw = properties?.N03_007 ?? properties?.prefCode ?? properties?.code ?? properties?.id;
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  if (!/^\d{1,5}$/.test(text)) return null;
  const code = to2DigitPrefCode(text);
  return PREFECTURE_CODE_2DIGIT_RE.test(code) ? code : null;
}
