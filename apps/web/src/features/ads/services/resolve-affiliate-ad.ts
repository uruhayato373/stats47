import {
  CATEGORY_AFFILIATE_MAP,
  resolveContentVertical,
  verticalsFromTagKeys,
  type AffiliateVertical,
  type ContentVerticalInput,
} from "../constants/affiliate-category";
import {
  readActiveBannersByVerticalsFromR2 as findActiveBannersByVerticals,
  readActiveExperimentVariantsByVerticalFromR2 as findActiveExperimentVariantsByVertical,
  readActiveTextAdByVerticalFromR2 as findActiveTextAdByVertical,
  readActiveTextAdsByVerticalsFromR2 as findActiveTextAdsByVerticals,
} from "../repositories/affiliate-ad-snapshot";

import type {
  AffiliateLocationCode,
  ResolvedAffiliateAd,
  ResolvedAffiliateBanner,
} from "../types";

/**
 * A/B テスト (AFF-05) の variant 候補。client (VariantAdSlot) が加重ランダムで1つ選ぶ。
 * banner は imageUrl あり、text は imageUrl=null。
 */
interface ResolvedAffiliateVariant {
  /** 広告 1 件単位の識別子 (AffiliateAd.id)。案件別 CTR 計測 (GA4 ad_id) 用 */
  id: string;
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

/** categoryKey (e-Stat 17 軸) → vertical。写像外は undefined。 */
function verticalFromCategoryKey(categoryKey: string): AffiliateVertical | undefined {
  return CATEGORY_AFFILIATE_MAP[categoryKey];
}

function toBanner(b: {
  id: string;
  title: string;
  htmlContent: string;
  imageUrl: string | null;
  trackingPixelUrl: string | null;
  width: number | null;
  height: number | null;
  vertical?: AffiliateVertical | null;
  categoryKey?: string | null;
}): ResolvedAffiliateBanner | null {
  // imageUrl は必須。trackingPixelUrl は任意 (ValueCommerce 等は別ピクセルを持たない)。
  if (!b.imageUrl) return null;
  return {
    id: b.id,
    title: b.title,
    href: b.htmlContent,
    imageUrl: b.imageUrl,
    trackingPixelUrl: b.trackingPixelUrl ?? null,
    width: b.width ?? 300,
    height: b.height ?? 250,
    // 解決は adVertical と同じ規約 (vertical 正・categoryKey フォールバック)。
    vertical: b.vertical ?? (b.categoryKey ? CATEGORY_AFFILIATE_MAP[b.categoryKey] ?? null : null),
  };
}

/**
 * categoryKey に対応するテキスト広告を 1 件解決する。該当なしなら null。
 */
export async function resolveAffiliateAd(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
): Promise<ResolvedAffiliateAd | null> {
  const vertical = verticalFromCategoryKey(categoryKey);
  if (!vertical) return null;
  const dbAd = await findActiveTextAdByVertical(vertical, locationCode);
  if (!dbAd) return null;
  return {
    id: dbAd.id,
    title: dbAd.title,
    href: dbAd.htmlContent,
    trackingPixelUrl: dbAd.trackingPixelUrl,
  };
}

/**
 * categoryKey に対応するテキスト広告を複数解決する (priority 降順、最大 limit 件)。
 */
export async function resolveAffiliateTextAds(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2,
  rankingKey?: string,
): Promise<ResolvedAffiliateAd[]> {
  const vertical = verticalFromCategoryKey(categoryKey);
  if (!vertical) return [];
  const ads = await findActiveTextAdsByVerticals([vertical], locationCode, limit, rankingKey);
  return ads.map((ad) => ({
    id: ad.id,
    title: ad.title,
    href: ad.htmlContent,
    trackingPixelUrl: ad.trackingPixelUrl,
  }));
}

/**
 * tagKey 配列からテキスト広告を複数解決する (ブログ記事サイドバー用)。
 * tagKey → vertical を収集し、id/title で dedupe して priority 降順で返す。
 * タグ解決不能・一致在庫なしは空配列を返し、別 vertical を推測しない。
 */
export async function resolveAffiliateTextAdsByTagKeys(
  tagKeys: string[],
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2,
): Promise<ResolvedAffiliateAd[]> {
  const verticals = verticalsFromTagKeys(tagKeys);
  if (verticals.length === 0) return [];

  const ads = await findActiveTextAdsByVerticals(verticals, locationCode);

  // vertical 集約後も同一広告が重複しうるため title で dedupe
  const seen = new Set<string>();
  const unique: ResolvedAffiliateAd[] = [];
  for (const ad of ads) {
    if (seen.has(ad.title)) continue;
    seen.add(ad.title);
    unique.push({
      id: ad.id,
      title: ad.title,
      href: ad.htmlContent,
      trackingPixelUrl: ad.trackingPixelUrl,
    });
    if (unique.length >= limit) break;
  }
  return unique;
}

/**
 * tagKey 配列からバナー広告を解決する。
 */
export async function resolveAffiliateBanners(
  tagKeys: string[],
  limit = 2,
  rankingKey?: string,
): Promise<ResolvedAffiliateBanner[]> {
  const verticals = verticalsFromTagKeys(tagKeys);
  if (verticals.length === 0) return [];
  const banners = await findActiveBannersByVerticals(verticals, limit, rankingKey);
  return banners.map(toBanner).filter((b): b is ResolvedAffiliateBanner => b !== null);
}

/**
 * 単一 categoryKey に対応するバナー広告を priority 降順で解決する (最大 limit 件)。
 * ランキング / カテゴリ等、categoryKey を持つページのサイドバーにバナーを出す用途。
 */
export async function resolveAffiliateBannersByCategoryKey(
  categoryKey: string,
  limit = 1,
  rankingKey?: string,
): Promise<ResolvedAffiliateBanner[]> {
  const vertical = verticalFromCategoryKey(categoryKey);
  if (!vertical) return [];
  const banners = await findActiveBannersByVerticals([vertical], limit, rankingKey);
  return banners.map(toBanner).filter((b): b is ResolvedAffiliateBanner => b !== null);
}

/**
 * vertical 直指定でテキスト広告を複数解決する (priority 降順、最大 limit 件)。
 */
export async function resolveAffiliateTextAdsByVertical(
  vertical: AffiliateVertical,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2,
  rankingKey?: string,
): Promise<ResolvedAffiliateAd[]> {
  const ads = await findActiveTextAdsByVerticals([vertical], locationCode, limit, rankingKey);
  return ads.map((ad) => ({
    id: ad.id,
    title: ad.title,
    href: ad.htmlContent,
    trackingPixelUrl: ad.trackingPixelUrl,
  }));
}

/**
 * ページ内容 (出典調査 → タグ → カテゴリ) から意図軸を決めてバナーを解決する。
 * ranking / blog / 市区町村 など「内容を持つページ」の共通入口 (2026-09-03)。
 * 解決順の正典は `resolveContentVertical`。調査が null を返した場合は空 (広告を出さない)。
 */
export async function resolveAffiliateBannersForContent(
  input: ContentVerticalInput,
  limit = 8,
  rankingKey?: string,
): Promise<ResolvedAffiliateBanner[]> {
  const resolution = resolveContentVertical(input);
  if (resolution.verticals.length === 0) return [];
  const banners = await findActiveBannersByVerticals(resolution.verticals, limit, rankingKey);
  return banners.map(toBanner).filter((b): b is ResolvedAffiliateBanner => b !== null);
}

/**
 * ページ内容から意図軸を決めてテキスト広告を解決する (`resolveAffiliateBannersForContent` の text 版)。
 * 同一広告が複数 vertical に重複しうるため title で dedupe する。
 */
export async function resolveAffiliateTextAdsForContent(
  input: ContentVerticalInput,
  locationCode: AffiliateLocationCode = "sidebar-bottom",
  limit = 2,
  rankingKey?: string,
): Promise<ResolvedAffiliateAd[]> {
  const resolution = resolveContentVertical(input);
  if (resolution.verticals.length === 0) return [];
  const ads = await findActiveTextAdsByVerticals(resolution.verticals, locationCode, 20, rankingKey);
  const seen = new Set<string>();
  const unique: ResolvedAffiliateAd[] = [];
  for (const ad of ads) {
    if (seen.has(ad.title)) continue;
    seen.add(ad.title);
    unique.push({ id: ad.id, title: ad.title, href: ad.htmlContent, trackingPixelUrl: ad.trackingPixelUrl });
    if (unique.length >= limit) break;
  }
  return unique;
}

/**
 * vertical 直指定でバナー広告を解決する (テーマページ等、themeKey → vertical で解決する用途)。
 */
export async function resolveAffiliateBannersByVertical(
  vertical: AffiliateVertical,
  limit = 2,
  rankingKey?: string,
): Promise<ResolvedAffiliateBanner[]> {
  const banners = await findActiveBannersByVerticals([vertical], limit, rankingKey);
  return banners.map(toBanner).filter((b): b is ResolvedAffiliateBanner => b !== null);
}

/**
 * A/B テスト (AFF-05): categoryKey に紐づく experiment variant 候補を解決する。
 * 1 件以下なら実験成立しないため [] を返し、呼び出し側は従来の banner/text 解決にフォールバックする。
 */
export async function resolveExperimentVariantsByCategoryKey(
  categoryKey: string,
): Promise<ResolvedAffiliateVariant[]> {
  const vertical = verticalFromCategoryKey(categoryKey);
  if (!vertical) return [];

  const rows = await findActiveExperimentVariantsByVertical(vertical);
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
        id: r.id,
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
 * すべての vertical に対してバナーを一括解決する。
 * category prop で affiliate-banner を宣言的に配置する際のサーバー側解決に使う。
 */
export async function resolveAffiliateBannersByCategory(): Promise<
  Partial<Record<AffiliateVertical, ResolvedAffiliateBanner>>
> {
  const allVerticals = [...new Set(Object.values(CATEGORY_AFFILIATE_MAP))];
  const banners = await findActiveBannersByVerticals(allVerticals, 100);

  const result: Partial<Record<AffiliateVertical, ResolvedAffiliateBanner>> = {};

  for (const b of banners) {
    const vertical = b.vertical ?? (b.categoryKey ? CATEGORY_AFFILIATE_MAP[b.categoryKey] : undefined);
    if (!vertical || result[vertical]) continue;
    const resolved = toBanner(b);
    if (resolved) result[vertical] = resolved;
  }

  return result;
}
