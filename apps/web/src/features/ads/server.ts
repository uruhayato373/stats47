import "server-only";

export {
  resolveAffiliateBanners,
  resolveAffiliateBannersByCategory,
  resolveAffiliateBannersByCategoryKey,
  resolveAffiliateBannersByVertical,
  resolveAffiliateBannersForContent,
  resolveAffiliateTextAdsByTagKeys,
  resolveAffiliateTextAdsByVertical,
  resolveAffiliateTextAdsForContent,
} from "./services/resolve-affiliate-ad";
export { AffiliateAdSlot } from "./components/AffiliateAdSlot";
export { AreaBannerAd } from "./components/AreaBannerAd";
// 縦長 (スカイスクレイパー) 専用スロット。sidebar-sticky 在庫の唯一の受け皿。
export { SidebarStickyBannerAd } from "./components/SidebarStickyBannerAd";
// R2 snapshot (server-only reader) を読む async Server Component。
// client-safe な index.ts には置けない (2026-08-04 に移動)。
export { FurusatoNozeiCard } from "./components/FurusatoNozeiCard";
export { RakutenItemsCard } from "./components/RakutenItemsCard";
