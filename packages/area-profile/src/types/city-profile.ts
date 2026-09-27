import type { AreaProfileData } from "./index";

/**
 * 市区町村 profile.json (県内順位の上位 = 特徴)。構造は県の AreaProfileData と同じで、weaknesses は常に空。
 * R2 キーは cityProfileKeyPath。Web はこの型と readCityProfileFromR2 だけを使う (独自定義しない)。
 */
export type CityProfileData = AreaProfileData;

/** 市区町村プロファイル R2 キー: app/areas/{prefCode}/cities/{cityCode}/profile.json */
export function cityProfileKeyPath(prefectureCode: string, cityCode: string): string {
  return `app/areas/${prefectureCode}/cities/${cityCode}/profile.json`;
}
