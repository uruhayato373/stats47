"use server";

import { getAreaProfileByCode } from "@stats47/area-profile/server";

import type { AreaProfileData } from "@stats47/area-profile";

/**
 * 地域プロファイルデータを取得する
 */
export async function getAreaProfileAction(
  areaCode: string
): Promise<AreaProfileData | null> {
  return getAreaProfileByCode(areaCode);
}
