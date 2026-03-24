/**
 * @stats47/area
 *
 * 都道府県・市区町村の型定義、ユーティリティ、静的データを提供。
 */

// 型定義
export type {
    Area,
    AreaType,
    City,
    Prefecture,
    Region
} from "./types";

// 定数
export {
    NATIONAL_AREA,
    PREFECTURE_SHORT_TO_REGION_MAP,
    PREFECTURE_TO_REGION_MAP,
    REGIONS
} from "./constants";

// ユーティリティ
export {
    extractPrefectureCode,
    lookupArea
} from "./utils";

// リポジトリ（防御的コピーを返す）
export { fetchCities } from "./repositories/fetch-cities";
export { fetchPrefectures } from "./repositories/fetch-prefectures";

