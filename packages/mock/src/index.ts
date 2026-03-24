/**
 * @stats47/mock - Shared Mock Data Package
 *
 * admin と web の両方の Storybook で利用可能なモックデータを提供します。
 *
 * 使用例:
 * ```typescript
 * import { rankingItems, rankingData } from "@stats47/mock/ranking";
 * import { jpPrefectures } from "@stats47/mock/geoshape";
 * import { categories } from "@stats47/mock/category";
 * ```
 */

// 名前空間を使って明示的にエクスポート
export * as ranking from "./ranking";
export * as geoshape from "./geoshape";
export * as area from "./area";
export * as category from "./category";
export * as database from "./database";
export * as estatApi from "./estat-api";
