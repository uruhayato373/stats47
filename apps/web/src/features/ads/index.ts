// Components (Client-safe)
export { AdSenseAdWrapper } from "./components/AdSenseAdWrapper";
export { BannerAd } from "./components/BannerAd";
export { FurusatoNozeiCard } from "./components/FurusatoNozeiCard";
export { FurusatoNozeiPopularCard } from "./components/FurusatoNozeiPopularCard";
export { TechSchoolPromoCard } from "./components/TechSchoolPromoCard";
// AreaBannerAd は server-only 依存のため barrel export しない
// 各ページから直接インポートすること: @/features/ads/components/AreaBannerAd
export { TrackedAffiliateLink } from "./components/tracked-affiliate-link";

// Constants & Types
export type { AffiliateCategory } from "./constants/affiliate-category";
export { CATEGORY_AFFILIATE_MAP, TAG_AFFILIATE_MAP, AFFILIATE_THEME } from "./constants/affiliate-category";
export { CATEGORY_BOOKS, buildAmazonUrl } from "./constants/related-books";
export type { BookRecommendation } from "./constants/related-books";
export type { AffiliateAd, AffiliateLocationCode } from "./types";

// Utilities
export { pickPrefCodeForSlug } from "./lib/pick-pref-for-slug";
