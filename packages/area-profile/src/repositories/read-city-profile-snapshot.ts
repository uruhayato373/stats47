import "server-only";

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { parseAreaProfileData } from "../types";
import { cityProfileKeyPath, type CityProfileData } from "../types/city-profile";

/**
 * R2 `app/areas/<pref>/cities/<city>/profile.json` を読む。未生成・取得失敗は null
 * (市区町村ページは特徴欄を出さずに描画する)。
 */
export async function readCityProfileFromR2(
  prefectureCode: string,
  cityCode: string,
): Promise<CityProfileData | null> {
  try {
    const raw = await fetchFromR2AsJson<unknown>(cityProfileKeyPath(prefectureCode, cityCode));
    return raw ? parseAreaProfileData(raw) : null;
  } catch {
    return null;
  }
}
