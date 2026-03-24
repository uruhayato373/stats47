/**
 * Area Domain（UI層）
 *
 * ロジックは @stats47/area から再エクスポート。
 * UI固有のコンポーネント・フックはここで定義。
 *
 * @example
 * ```ts
 * // 型定義のインポート
 * import type { Prefecture, City, AreaType } from "@/features/area";
 *
 * // ユーティリティ関数のインポート
 * import { determineAreaType } from "@/features/area";
 *
 * // リポジトリのインポート
 * import { fetchPrefectures, fetchCities } from "@/features/area";
 * ```
 */

// @stats47/area から再エクスポート
export * from "@stats47/area";


