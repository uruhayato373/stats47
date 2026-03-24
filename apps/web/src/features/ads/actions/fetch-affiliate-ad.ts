"use server";

import { ok, err } from "@stats47/types";

import { resolveAffiliateAd } from "../services/resolve-affiliate-ad";
import type { AffiliateLocationCode } from "../types";

/**
 * categoryKey に対応するアフィリエイト広告を取得する Server Action。
 * DB優先・定数フォールバックの解決は resolveAffiliateAd に委譲する。
 */
export async function fetchAffiliateAdAction(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom"
) {
  try {
    const ad = await resolveAffiliateAd(categoryKey, locationCode);
    return ok(ad);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
