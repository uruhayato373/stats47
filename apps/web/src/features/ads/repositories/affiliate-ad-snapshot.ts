import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import { adVertical, type AffiliateVertical } from "../constants/affiliate-category";

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

/**
 * ranking-key 単位のターゲティング判定 (転職クラスタの文脈一致配置)。
 * - targetRankingKeys 未設定/空 → 無制限 (従来挙動・後方互換)。
 * - 設定済 かつ rankingKey 指定あり → 一致時のみ対象 (ranking ページの native / sidebar 枠)。
 * - 設定済 かつ rankingKey 無し (blog 等 非 ranking 文脈) → 対象外。
 *   targetRankingKeys は広告を掲載できるページの hard allowlist として扱う。
 */
function matchesRankingTarget(ad: AffiliateAdRow, rankingKey?: string): boolean {
  const targets = ad.targetRankingKeys;
  if (!targets || targets.length === 0) return true;
  if (rankingKey == null) return false;
  return targets.includes(rankingKey);
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
      (a) => inVerticals(a, set) && a.locationCode === locationCode && a.adType === "text",
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
  return active
    .filter(
      (a) =>
        inVerticals(a, set) &&
        a.locationCode === locationCode &&
        a.adType === "text" &&
        matchesRankingTarget(a, rankingKey),
    )
    .sort(compareByPriorityDesc)
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
  return active
    .filter(
      (a) => inVerticals(a, set) && a.adType === "banner" && matchesRankingTarget(a, rankingKey),
    )
    .sort(compareByPriorityDesc)
    .slice(0, limit);
}

/**
 * A/B テスト (AFF-05) 用: vertical に紐づく experiment variant を全件取得する。
 * experimentId を持つ active エントリのみ (adType は banner/text 両方)。priority 降順。
 * experiment が無い vertical では空配列を返す (呼び出し側は従来解決にフォールバック)。
 */
export async function readActiveExperimentVariantsByVerticalFromR2(
  vertical: AffiliateVertical,
): Promise<AffiliateAdRow[]> {
  const active = await getActive();
  const set = new Set<AffiliateVertical>([vertical]);
  return active
    .filter((a) => inVerticals(a, set) && !!a.experimentId && !!a.variantId)
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
