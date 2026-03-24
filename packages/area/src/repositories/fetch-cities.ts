import type { City } from "../types";
import { CITIES } from "../data";

/**
 * 市区町村一覧を取得
 *
 * 静的JSONファイルから市区町村データを取得します。
 *
 * @returns {City[]} 市区町村データの配列
 *
 * @example
 * ```ts
 * import { fetchCities } from '@stats47/area';
 * const cities = fetchCities();
 * console.log(`市区町村数: ${cities.length}`);
 * ```
 */
export function fetchCities(): City[] {
  return [...CITIES];
}
