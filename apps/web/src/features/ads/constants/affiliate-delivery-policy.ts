import { adVertical } from "./affiliate-category";

import type { AffiliateAd } from "../types";

/**
 * 掲載停止の authored SSOT。提携状態または文脈・実績の判断で停止した案件を保持する。
 * snapshot更新前でも停止が効くよう、exportとruntimeの両方から参照する。
 * 提携の再確認なしに解除しない。証拠: affiliate-stocktake-latest.json。
 */
export const AFFILIATE_DELIVERY_HOLDS = [
  { adId: "af_aeon_kyushu_001", programRef: "a8:s00000025671001" },
  { adId: "af_classpass_001", programRef: "a8:s00000026970001" },
  { adId: "af_housing_banner_001", programRef: "a8:s00000014870004" },
  { adId: "af_maca_emperor_001", programRef: "a8:s00000013307005" },
  // 2026-09-18 オーナー判断 (AFF-BRAND-FIT-01): 公的統計サイトの信頼を優先し health 軸の
  // 精力・マカ系サプリを停止する。再登録は a8-curated.json の blocklistKeywords が防ぐ。
  { adId: "af_s00000013307001_a8_001", programRef: "a8:s00000013307001" },
  { adId: "af_s00000013307001_a8_text_001", programRef: "a8:s00000013307001" },
] as const;

export function isAffiliateDeliveryHeld(ad: Pick<AffiliateAd, "id" | "programRef" | "offerProfile">): boolean {
  return AFFILIATE_DELIVERY_HOLDS.some((hold) =>
    hold.adId === ad.id || hold.programRef === ad.programRef,
  ) || ad.offerProfile?.portfolioStatus === "blocked"
    || ad.offerProfile?.portfolioStatus === "paused";
}

export function isAffiliateActive(ad: AffiliateAd, today = new Date().toISOString().slice(0, 10)): boolean {
  return !!ad.isActive && !isAffiliateDeliveryHeld(ad)
    && (!ad.startDate || ad.startDate <= today)
    && (!ad.endDate || ad.endDate >= today);
}

/** 対象keyはhard allowlist。人口・医療という分類だけでは婚活やジムの申込意図とみなさない。 */
export function matchesRankingTarget(ad: AffiliateAd, rankingKey?: string): boolean {
  const targets = ad.targetRankingKeys;
  if (["population", "health"].includes(adVertical(ad) ?? "") && !targets?.length) return false;
  if (!targets?.length) return true;
  return rankingKey != null && targets.includes(rankingKey);
}

export interface AffiliateDestination {
  href: string;
  programRef?: string;
}

/** 本文・レールを横断し、別サイズ/別リンクの同一案件も重複させない。 */
export function isAffiliateDestinationExcluded(ad: AffiliateDestination, excluded: readonly AffiliateDestination[]): boolean {
  return excluded.some((used) => used.href === ad.href
    || (!!ad.programRef && used.programRef === ad.programRef));
}

/** 同一案件・同一クリック先のplacement別creativeは、1つの候補群では1件だけにする。 */
export function uniqueAffiliateDestinations<T extends Pick<AffiliateAd, "programRef" | "htmlContent">>(ads: T[]): T[] {
  const programs = new Set<string>();
  const hrefs = new Set<string>();
  return ads.filter((ad) => {
    if (hrefs.has(ad.htmlContent) || (ad.programRef && programs.has(ad.programRef))) return false;
    hrefs.add(ad.htmlContent);
    if (ad.programRef) programs.add(ad.programRef);
    return true;
  });
}
