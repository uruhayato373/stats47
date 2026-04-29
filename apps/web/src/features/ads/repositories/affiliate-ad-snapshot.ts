import "server-only";

import { type affiliateAds } from "@stats47/database/schema";
import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { AffiliateLocationCode } from "../types";

export type AffiliateAdRow = typeof affiliateAds.$inferSelect;

export const AFFILIATE_ADS_SNAPSHOT_KEY = "snapshots/affiliate-ads/all.json";

const STALE_AFTER_DAYS = 30;

export interface AffiliateAdsSnapshot {
  generatedAt: string;
  ads: AffiliateAdRow[];
}

let cached: AffiliateAdsSnapshot | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `affiliate-ads snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadSnapshot(): Promise<AffiliateAdsSnapshot> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<AffiliateAdsSnapshot>(
    AFFILIATE_ADS_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: AFFILIATE_ADS_SNAPSHOT_KEY },
      "affiliate-ads snapshot が R2 に存在しません。空配列を返します",
    );
    cached = { generatedAt: new Date(0).toISOString(), ads: [] };
    return cached;
  }
  warnIfStale(snapshot.generatedAt);
  cached = snapshot;
  return snapshot;
}

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
