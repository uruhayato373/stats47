import type { Prefecture } from "../types";
import { PREFECTURES } from "../data";

/**
 * 都道府県一覧を取得
 *
 * 静的JSONファイルから都道府県データを取得します。
 *
 * @returns {Prefecture[]} 都道府県データの配列
 *
 * @example
 * ```ts
 * import { fetchPrefectures } from '@stats47/area';
 * const prefectures = fetchPrefectures();
 * console.log(`都道府県数: ${prefectures.length}`); // 47
 * ```
 */
export function fetchPrefectures(): Prefecture[] {
  return [...PREFECTURES];
}
