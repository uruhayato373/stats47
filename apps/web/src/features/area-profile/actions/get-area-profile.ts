"use server";

import { readAreaProfileFromR2 } from "@stats47/area-profile/server";

import type { AreaProfileData } from "@stats47/area-profile";

/**
 * 地域プロファイルデータを取得する
 *
 * Phase 5c: D1 → R2 snapshot 化。
 * 緊急時のフォールバックは getAreaProfileByCode (D1) を直接使用。
 */
export async function getAreaProfileAction(
  areaCode: string
): Promise<AreaProfileData | null> {
  return readAreaProfileFromR2(areaCode);
}
