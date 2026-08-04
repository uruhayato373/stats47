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
// R2 snapshot (server-only reader) を読む async Server Component。
// client-safe な index.ts には置けない (2026-08-04 に移動)。
export { FurusatoNozeiCard } from "./components/FurusatoNozeiCard";
export { RakutenItemsCard } from "./components/RakutenItemsCard";
