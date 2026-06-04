import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import type { AffiliateAd, AffiliateLocationCode } from "../types";

export type AffiliateAdRow = AffiliateAd;

export const AFFILIATE_ADS_SNAPSHOT_KEY = "app/affiliate-ads/all.json";

export interface AffiliateAdsSnapshot {
  generatedAt: string;
  ads: AffiliateAdRow[];
}

// module-level キャッシュは持たない (r2-storage-design.md)。
// 一時的な miss を恒久キャッシュしないため毎回 R2 を直接 fetch する。
const loadSnapshot = createSnapshotReader<AffiliateAdsSnapshot, AffiliateAdsSnapshot>({
  key: AFFILIATE_ADS_SNAPSHOT_KEY,
  label: "affiliate-ads",
  select: (snapshot) => snapshot,
  fallback: { generatedAt: new Date(0).toISOString(), ads: [] },
});

function isActive(ad: AffiliateAdRow): boolean {
  if (!ad.isActive) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (ad.startDate && ad.startDate > today) return false;
  if (ad.endDate && ad.endDate < today) return false;
  return true;
}

function compareByPriorityDesc(a: AffiliateAdRow, b: AffiliateAdRow): number {
  return (b.priority ?? 0) - (a.priority ?? 0);
}

async function getActive(): Promise<AffiliateAdRow[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  try {
    const snapshot = await loadSnapshot();
    return snapshot.ads.filter(isActive);
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "readActiveAffiliateAdsFromR2: failed",
    );
    return [];
  }
}

export async function readActiveAdByCategoryFromR2(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
): Promise<AffiliateAdRow | null> {
  const active = await getActive();
  const matched = active
    .filter(
      (a) =>
        a.categoryKey === categoryKey &&
        a.locationCode === locationCode &&
        a.adType === "text",
    )
    .sort(compareByPriorityDesc);
  return matched[0] ?? null;
}

/**
 * categoryKey + locationCode のテキスト広告を priority 降順で複数取得する。
 * サイドバーに複数のテキストリンクを並べて表示する用途。
 */
export async function readActiveTextAdsByCategoryFromR2(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2,
): Promise<AffiliateAdRow[]> {
  const active = await getActive();
  return active
    .filter(
      (a) =>
        a.categoryKey === categoryKey &&
        a.locationCode === locationCode &&
        a.adType === "text",
    )
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}

/**
 * 複数 categoryKey をまたいでテキスト広告を取得する (tagKey ベースのブログ用)。
 * 同一広告が複数 categoryKey に登録されているため、呼び出し側で title 等により dedupe する。
 */
export async function readActiveTextAdsByCategoryKeysFromR2(
  categoryKeys: string[],
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 20,
): Promise<AffiliateAdRow[]> {
  if (categoryKeys.length === 0) return [];
  const active = await getActive();
  const set = new Set(categoryKeys);
  return active
    .filter(
      (a) =>
        a.categoryKey != null &&
        set.has(a.categoryKey) &&
        a.locationCode === locationCode &&
        a.adType === "text",
    )
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}

export async function readActiveBannersByCategoryFromR2(
  categoryKey: string,
  limit = 2,
): Promise<AffiliateAdRow[]> {
  const active = await getActive();
  return active
    .filter((a) => a.categoryKey === categoryKey && a.adType === "banner")
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}

export async function readActiveBannersByCategoryKeysFromR2(
  categoryKeys: string[],
  limit = 2,
): Promise<AffiliateAdRow[]> {
  if (categoryKeys.length === 0) return [];
  const active = await getActive();
  const set = new Set(categoryKeys);
  return active
    .filter((a) => a.categoryKey && set.has(a.categoryKey) && a.adType === "banner")
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}

/**
 * A/B テスト (AFF-05) 用: categoryKey に紐づく experiment variant を全件取得する。
 * experimentId を持つ active エントリのみ (adType は banner/text 両方)。priority 降順。
 * experiment が無いカテゴリでは空配列を返す (呼び出し側は従来解決にフォールバック)。
 */
export async function readActiveExperimentVariantsByCategoryFromR2(
  categoryKey: string,
): Promise<AffiliateAdRow[]> {
  if (!categoryKey) return [];
  const active = await getActive();
  return active
    .filter((a) => a.categoryKey === categoryKey && !!a.experimentId && !!a.variantId)
    .sort(compareByPriorityDesc);
}

export async function readActiveBannersByLocationFromR2(
  locationCode: AffiliateLocationCode,
  limit = 10,
): Promise<AffiliateAdRow[]> {
  const active = await getActive();
  return active
    .filter((a) => a.locationCode === locationCode && a.adType === "banner")
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}
