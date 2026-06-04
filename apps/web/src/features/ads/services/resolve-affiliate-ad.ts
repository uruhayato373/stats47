import {
  CATEGORY_AFFILIATE_MAP,
  TAG_AFFILIATE_MAP,
  type AffiliateCategory,
} from "../constants/affiliate-category";
import {
  readActiveAdByCategoryFromR2 as findActiveAdByCategory,
  readActiveBannersByCategoryKeysFromR2 as findActiveBannersByCategoryKeys,
  readActiveExperimentVariantsByCategoryFromR2 as findActiveExperimentVariantsByCategory,
  readActiveTextAdsByCategoryFromR2 as findActiveTextAdsByCategory,
  readActiveTextAdsByCategoryKeysFromR2 as findActiveTextAdsByCategoryKeys,
} from "../repositories/affiliate-ad-snapshot";

import type { AffiliateLocationCode } from "../types";

export interface ResolvedAffiliateAd {
  title: string;
  href: string;
  trackingPixelUrl?: string | null;
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
 * A/B テスト (AFF-05) の variant 候補。client (VariantAdSlot) が加重ランダムで1つ選ぶ。
 * banner は imageUrl あり、text は imageUrl=null。
 */
export interface ResolvedAffiliateVariant {
  experimentId: string;
  variantId: string;
  weight: number;
  adType: "banner" | "text";
  title: string;
  href: string;
  trackingPixelUrl: string | null;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
  /** GA4 creative_size 用 例: "300x250" / "text" */
  creativeSize: string;
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
    trackingPixelUrl: dbAd.trackingPixelUrl,
  };
}

/**
 * categoryKey に対応するテキスト広告を複数解決する (priority 降順、最大 limit 件)。
 * サイドバーに複数のテキストリンクを並べて表示する用途。
 */
export async function resolveAffiliateTextAds(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2
): Promise<ResolvedAffiliateAd[]> {
  const ads = await findActiveTextAdsByCategory(categoryKey, locationCode, limit);
  return ads.map((ad) => ({
    title: ad.title,
    href: ad.htmlContent,
    trackingPixelUrl: ad.trackingPixelUrl,
  }));
}

/**
 * tagKey 配列からテキスト広告を複数解決する (ブログ記事サイドバー用)。
 * tagKey → AffiliateCategory → categoryKey(s) を収集し、title で dedupe して priority 降順で返す。
 * 該当タグが無い記事でも表示できるよう、マッチ無し時は economy にフォールバックする。
 */
export async function resolveAffiliateTextAdsByTagKeys(
  tagKeys: string[],
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2
): Promise<ResolvedAffiliateAd[]> {
  const triedCategories = new Set<AffiliateCategory>();
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

  // タグ未マッチの記事でもテキスト広告を出すための fallback
  if (allCategoryKeys.length === 0) allCategoryKeys.push("economy");

  const ads = await findActiveTextAdsByCategoryKeys(allCategoryKeys, locationCode);

  // 同一広告が複数 categoryKey に登録されているため title で dedupe
  const seen = new Set<string>();
  const unique: ResolvedAffiliateAd[] = [];
  for (const ad of ads) {
    if (seen.has(ad.title)) continue;
    seen.add(ad.title);
    unique.push({ title: ad.title, href: ad.htmlContent, trackingPixelUrl: ad.trackingPixelUrl });
    if (unique.length >= limit) break;
  }
  return unique;
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

/**
 * 単一 categoryKey に対応するバナー広告を priority 降順で解決する (最大 limit 件)。
 * ランキング / カテゴリ等、categoryKey を持つページのサイドバーにバナーを出す用途。
 * (resolveAffiliateBanners は tagKey ベースのため、categoryKey 直指定はこちらを使う)
 */
export async function resolveAffiliateBannersByCategoryKey(
  categoryKey: string,
  limit = 1
): Promise<ResolvedAffiliateBanner[]> {
  if (!categoryKey) return [];

  const banners = await findActiveBannersByCategoryKeys([categoryKey], limit);

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

/**
 * A/B テスト (AFF-05): categoryKey に紐づく experiment variant 候補を解決する。
 * experimentId を持つ active エントリのみ。1 件以下なら実験成立しないため [] を返し、
 * 呼び出し側 (AffiliateAdSlot) は従来の banner/text 解決にフォールバックする。
 */
export async function resolveExperimentVariantsByCategoryKey(
  categoryKey: string
): Promise<ResolvedAffiliateVariant[]> {
  if (!categoryKey) return [];

  const rows = await findActiveExperimentVariantsByCategory(categoryKey);
  if (rows.length < 2) return []; // 実験は最低 2 variant 必要

  return rows
    .filter((r) => {
      // banner は画像必須、text は htmlContent(href) 必須
      if (r.adType === "banner") return !!r.imageUrl;
      return !!r.htmlContent;
    })
    .map((r) => {
      const adType = r.adType === "banner" ? "banner" : "text";
      const creativeSize =
        adType === "banner" && r.width && r.height ? `${r.width}x${r.height}` : "text";
      return {
        experimentId: r.experimentId as string,
        variantId: r.variantId as string,
        weight: r.weight ?? 1,
        adType,
        title: r.title,
        href: r.htmlContent,
        trackingPixelUrl: r.trackingPixelUrl,
        imageUrl: adType === "banner" ? r.imageUrl : null,
        width: r.width,
        height: r.height,
        creativeSize,
      } satisfies ResolvedAffiliateVariant;
    });
}

/**
 * すべての AffiliateCategory に対してバナーを一括解決する。
 * category prop で affiliate-banner を宣言的に配置する際のサーバー側解決に使う。
 */
export async function resolveAffiliateBannersByCategory(): Promise<Partial<Record<AffiliateCategory, ResolvedAffiliateBanner>>> {
  const allCategoryKeys = Object.keys(CATEGORY_AFFILIATE_MAP);
  const banners = await findActiveBannersByCategoryKeys(allCategoryKeys, 100);

  const result: Partial<Record<AffiliateCategory, ResolvedAffiliateBanner>> = {};

  for (const b of banners) {
    if (!b.imageUrl || !b.trackingPixelUrl || !b.categoryKey) continue;
    const affiliateCategory = CATEGORY_AFFILIATE_MAP[b.categoryKey];
    if (!affiliateCategory || result[affiliateCategory]) continue;
    result[affiliateCategory] = {
      title: b.title,
      href: b.htmlContent,
      imageUrl: b.imageUrl,
      trackingPixelUrl: b.trackingPixelUrl,
      width: b.width ?? 300,
      height: b.height ?? 250,
    };
  }

  return result;
}
