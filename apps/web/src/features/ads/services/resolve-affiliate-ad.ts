import {
  CATEGORY_AFFILIATE_MAP,
  TAG_AFFILIATE_MAP,
} from "../constants/affiliate-category";
import {
  readActiveAdByCategoryFromR2 as findActiveAdByCategory,
  readActiveBannersByCategoryKeysFromR2 as findActiveBannersByCategoryKeys,
} from "../repositories/affiliate-ad-snapshot";

import type { AffiliateLocationCode } from "../types";

export interface ResolvedAffiliateAd {
  title: string;
  href: string;
}

export interface ResolvedAffiliateBanner {
  title: string;
  href: string;
  imageUrl: string;
  trackingPixelUrl: string;
  width: number;
  height: number;
}

/**
 * categoryKey に対応するテキスト広告を DB から解決する。
 * 該当なしなら null を返す。
 */
export async function resolveAffiliateAd(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom"
): Promise<ResolvedAffiliateAd | null> {
  const dbAd = await findActiveAdByCategory(categoryKey, locationCode);
  if (!dbAd) return null;

  return {
    title: dbAd.title,
    href: dbAd.htmlContent,
  };
}

/**
 * tagKey 配列からバナー広告を DB で解決する。
 * マッチする全カテゴリの categoryKey を収集し、一括クエリで取得する。
 */
export async function resolveAffiliateBanners(
  tagKeys: string[],
  limit = 2
): Promise<ResolvedAffiliateBanner[]> {
  // tagKey → AffiliateCategory → categoryKey(s) を一括収集
  const triedCategories = new Set<string>();
  const allCategoryKeys: string[] = [];

  for (const tagKey of tagKeys) {
    const affiliateCategory = TAG_AFFILIATE_MAP[tagKey];
    if (!affiliateCategory || triedCategories.has(affiliateCategory)) continue;
    triedCategories.add(affiliateCategory);

    const categoryKeys = Object.entries(CATEGORY_AFFILIATE_MAP)
      .filter(([, cat]) => cat === affiliateCategory)
      .map(([key]) => key);
    allCategoryKeys.push(...categoryKeys);
  }

  if (allCategoryKeys.length === 0) return [];

  // 一括クエリで取得
  const banners = await findActiveBannersByCategoryKeys(allCategoryKeys, limit);

  return banners
    .filter((b) => b.imageUrl && b.trackingPixelUrl)
    .map((b) => ({
      title: b.title,
      href: b.htmlContent,
      imageUrl: b.imageUrl!,
      trackingPixelUrl: b.trackingPixelUrl!,
      width: b.width ?? 300,
      height: b.height ?? 250,
    }));
}
