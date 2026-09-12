import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import {
  AFFILIATE_VERTICALS,
  adVertical,
  type AffiliateVertical,
} from "../constants/affiliate-category";
import { isAffiliateActive, matchesRankingTarget, uniqueAffiliateDestinations } from "../constants/affiliate-delivery-policy";

import type { AffiliateAd, AffiliateLocationCode } from "../types";

export type AffiliateAdRow = AffiliateAd;

export const AFFILIATE_ADS_SNAPSHOT_KEY = "app/affiliate-ads/all.json";

export interface AffiliateAdsSnapshot {
  generatedAt: string;
  ads: AffiliateAdRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAffiliateAd(value: unknown, index: number): AffiliateAdRow {
  if (!isRecord(value)) throw new Error(`ads[${index}] must be an object`);
  const path = (field: string) => `ads[${index}].${field}`;
  for (const field of ["id", "title", "htmlContent", "locationCode", "adType"] as const) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw new Error(`${path(field)} must be a non-empty string`);
    }
  }
  const nullableStrings = [
    "areaCode", "categoryKey", "startDate", "endDate", "targetCategories",
    "imageUrl", "trackingPixelUrl", "createdAt", "updatedAt", "experimentId", "variantId",
  ] as const;
  for (const field of nullableStrings) {
    if (value[field] !== null && value[field] !== undefined && typeof value[field] !== "string") {
      throw new Error(`${path(field)} must be string, null, or omitted`);
    }
  }
  if (value.isActive !== null && typeof value.isActive !== "boolean") {
    throw new Error(`${path("isActive")} must be boolean or null`);
  }
  for (const field of ["priority", "width", "height", "weight"] as const) {
    if (value[field] !== null && value[field] !== undefined && !Number.isFinite(value[field])) {
      throw new Error(`${path(field)} must be finite number, null, or omitted`);
    }
  }
  if (value.vertical !== undefined && value.vertical !== null &&
    !AFFILIATE_VERTICALS.includes(value.vertical as AffiliateVertical)) {
    throw new Error(`${path("vertical")} must be a known affiliate vertical`);
  }
  if (value.programRef !== undefined &&
    (typeof value.programRef !== "string" || !/^(a8|afb|moshimo|rakuten|valuecommerce):[^:\s]+$/.test(value.programRef))) {
    throw new Error(`${path("programRef")} must be a known provider-prefixed reference`);
  }
  if (value.offerProfile !== undefined) {
    if (!isRecord(value.offerProfile)) throw new Error(`${path("offerProfile")} must be an object`);
    for (const field of ["lane", "actionType", "frictionTier", "portfolioStatus"] as const) {
      if (typeof value.offerProfile[field] !== "string") {
        throw new Error(`${path(`offerProfile.${field}`)} must be a string`);
      }
    }
    if (!Array.isArray(value.offerProfile.allowedPageTypes) ||
      !value.offerProfile.allowedPageTypes.every((pageType) => typeof pageType === "string")) {
      throw new Error(`${path("offerProfile.allowedPageTypes")} must contain strings`);
    }
  }
  if (value.targetRankingKeys !== undefined && value.targetRankingKeys !== null &&
    (!Array.isArray(value.targetRankingKeys) ||
      !value.targetRankingKeys.every((key) => typeof key === "string"))) {
    throw new Error(`${path("targetRankingKeys")} must contain strings`);
  }
  return value as unknown as AffiliateAdRow;
}

export function parseAffiliateAdsSnapshot(value: unknown): AffiliateAdsSnapshot {
  if (!isRecord(value)) throw new Error("affiliate ads snapshot must be an object");
  if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error("affiliate ads snapshot generatedAt must be a valid date string");
  }
  if (!Array.isArray(value.ads)) throw new Error("affiliate ads snapshot ads must be an array");
  return { generatedAt: value.generatedAt, ads: value.ads.map(parseAffiliateAd) };
}

// module-level キャッシュは持たない (r2-storage-design.md)。
// 一時的な miss を恒久キャッシュしないため毎回 R2 を直接 fetch する。
const loadSnapshot = createSnapshotReader<AffiliateAdsSnapshot, AffiliateAdsSnapshot>({
  key: AFFILIATE_ADS_SNAPSHOT_KEY,
  label: "affiliate-ads",
  parse: parseAffiliateAdsSnapshot,
  select: (snapshot) => snapshot,
  fallback: { generatedAt: new Date(0).toISOString(), ads: [] },
});

function compareByPriorityDesc(a: AffiliateAdRow, b: AffiliateAdRow): number {
  return (b.priority ?? 0) - (a.priority ?? 0);
}

async function getActive(includeExperimentVariants = false): Promise<AffiliateAdRow[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  try {
    const snapshot = await loadSnapshot();
    return snapshot.ads.filter((ad) => isAffiliateActive(ad)).filter(
      (ad) => includeExperimentVariants || !(ad.experimentId || ad.variantId),
    );
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "readActiveAffiliateAdsFromR2: failed",
    );
    return [];
  }
}

/** 広告が指定 vertical 群のいずれかに属するか (vertical 正・categoryKey フォールバック)。 */
function inVerticals(ad: AffiliateAdRow, set: Set<AffiliateVertical>): boolean {
  const v = adVertical(ad);
  return v != null && set.has(v);
}

/**
 * vertical + locationCode の単一テキスト広告を priority 降順で 1 件取得する。
 */
export async function readActiveTextAdByVerticalFromR2(
  vertical: AffiliateVertical,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
): Promise<AffiliateAdRow | null> {
  const active = await getActive();
  const set = new Set<AffiliateVertical>([vertical]);
  const matched = active
    .filter(
      (a) => inVerticals(a, set) && a.locationCode === locationCode && a.adType === "text" && matchesRankingTarget(a),
    )
    .sort(compareByPriorityDesc);
  return matched[0] ?? null;
}

/**
 * 複数 vertical をまたいでテキスト広告を priority 降順で取得する。
 * ページ→vertical→広告 の解決に使う。呼び出し側で id/title 等により dedupe する。
 */
export async function readActiveTextAdsByVerticalsFromR2(
  verticals: AffiliateVertical[],
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 20,
  rankingKey?: string,
): Promise<AffiliateAdRow[]> {
  if (verticals.length === 0) return [];
  const active = await getActive();
  const set = new Set(verticals);
  return uniqueAffiliateDestinations(active
    .filter(
      (a) =>
        inVerticals(a, set) &&
        a.locationCode === locationCode &&
        a.adType === "text" &&
        matchesRankingTarget(a, rankingKey),
    )
    .sort(compareByPriorityDesc))
    .slice(0, limit);
}

/**
 * 複数 vertical をまたいでバナー広告を priority 降順で取得する。
 */
export async function readActiveBannersByVerticalsFromR2(
  verticals: AffiliateVertical[],
  limit = 2,
  rankingKey?: string,
): Promise<AffiliateAdRow[]> {
  if (verticals.length === 0) return [];
  const active = await getActive();
  const set = new Set(verticals);
  return uniqueAffiliateDestinations(active
    .filter(
      (a) => inVerticals(a, set) && a.adType === "banner" && matchesRankingTarget(a, rankingKey),
    )
    .sort(compareByPriorityDesc))
    .slice(0, limit);
}

/**
 * A/B テスト (AFF-05) 用: vertical に紐づく experiment variant を全件取得する。
 * experimentId を持つ active エントリのみ (adType は banner/text 両方)。priority 降順。
 * experiment が無い vertical では空配列を返す (呼び出し側は従来解決にフォールバック)。
 */
export async function readActiveExperimentVariantsByVerticalFromR2(
  vertical: AffiliateVertical,
  rankingKey?: string,
): Promise<AffiliateAdRow[]> {
  const active = await getActive(true);
  const set = new Set<AffiliateVertical>([vertical]);
  return active
    .filter((a) => inVerticals(a, set) && !!a.experimentId && !!a.variantId && matchesRankingTarget(a, rankingKey))
    .sort(compareByPriorityDesc);
}

export async function readActiveBannersByLocationFromR2(
  locationCode: AffiliateLocationCode,
  limit = 10,
): Promise<AffiliateAdRow[]> {
  const active = await getActive();
  return uniqueAffiliateDestinations(active
    .filter((a) => a.locationCode === locationCode && a.adType === "banner" && matchesRankingTarget(a))
    .sort(compareByPriorityDesc))
    .slice(0, limit);
}
