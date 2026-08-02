import "server-only";

export {
  resolveAffiliateBanners,
  resolveAffiliateBannersByCategory,
  resolveAffiliateBannersByCategoryKey,
  resolveAffiliateBannersByVertical,
  resolveAffiliateTextAdsByTagKeys,
} from "./services/resolve-affiliate-ad";
export { AffiliateAdSlot } from "./components/AffiliateAdSlot";
export { AreaBannerAd } from "./components/AreaBannerAd";
