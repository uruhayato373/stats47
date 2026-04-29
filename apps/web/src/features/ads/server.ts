import "server-only";

export {
  readActiveAdByCategoryFromR2 as findActiveAdByCategory,
  readActiveBannersByCategoryFromR2 as findActiveBannersByCategory,
  readActiveBannersByCategoryKeysFromR2 as findActiveBannersByCategoryKeys,
  readActiveBannersByLocationFromR2 as findActiveBannersByLocation,
} from "./repositories/affiliate-ad-snapshot";
export { resolveAffiliateAd, resolveAffiliateBanners } from "./services/resolve-affiliate-ad";
export { fetchAffiliateAdAction } from "./actions/fetch-affiliate-ad";
export { AffiliateAdSlot } from "./components/AffiliateAdSlot";
export type { ResolvedAffiliateAd, ResolvedAffiliateBanner } from "./services/resolve-affiliate-ad";
export type { AffiliateLocationCode } from "./types";
export { AreaBannerAd } from "./components/AreaBannerAd";
