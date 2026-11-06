// Components (Client-safe)
//   R2 reader (server-only) を読むようになったため、この barrel に残すと
//   client component (md-content.tsx が BannerAd を import) の module graph に
//   server-only が混入して webpack build が落ちる。
//   server-only を含むコンポーネントは AffiliateAdSlot / AreaBannerAd と同じく server.ts から出す。
export { BannerAd } from "./components/BannerAd";
export { AffiliateTextAdList } from "./components/AffiliateTextAdList";
export { OperatorProfileCard } from "./components/OperatorProfileCard";
export { SidebarPromoBanner } from "./components/SidebarPromoBanner";
export { NativeAffiliateRow } from "./components/NativeAffiliateRow";
export { RelatedAmazonBook } from "./components/RelatedAmazonBook";
export { isLandscapeBanner } from "./utils";
export type { ResolvedAffiliateBanner } from "./types";

// 標準広告スロット部品（エディトリアル文法の統一枠）
export {
  InContentAdSlot,
  FooterAdSlot,
  RailAdSlot,
  AdCell,
  AdRow,
  type AdRowCell,
} from "./components/slots";
export { composeAdRows, type AdRowPattern } from "./lib/ad-row";

// Constants & Types
export { selectPromoBannerIndexForRanking } from "./constants/sidebar-banners";
