import { fetchPrefectures } from "../repositories/fetch-prefectures";
import { to2DigitPrefCode } from "./area-code";

// 変換と判定の本体は台帳を読まない葉のモジュール area-code.ts にある (ブラウザ向けの部品が台帳を束に入れないため)
export { isOkinawaAreaCode, to2DigitPrefCode, to5DigitPrefCode } from "./area-code";

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
