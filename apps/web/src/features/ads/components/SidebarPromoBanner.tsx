import { isAffiliateDeliveryHeld, isAffiliateDestinationExcluded, type AffiliateDestination } from "../constants/affiliate-delivery-policy";
import { SIDEBAR_PROMO_BANNERS } from "../constants/sidebar-banners";

import { BannerAd } from "./BannerAd";

interface SidebarPromoBannerProps {
  /** 固定枠にも本文と同じ文脈を要求する。未指定のhome/category/areaには掲載しない。 */
  rankingKey?: string;
  vertical?: string | null;
  excludeAds?: readonly AffiliateDestination[];
  /** SIDEBAR_PROMO_BANNERS の index (default 0 = 高単価 STRATEGY CAREER)。範囲外は wrap する。 */
  index?: number;
  /** GA4 計測の position ラベル */
  position?: string;
}

/**
 * 全ページ共通サイドバー用の固定アフィリエイトバナー。
 * PR見出し・説明・Card装飾を付けず、ASP提供バナー画像だけを表示する。
 */
export function SidebarPromoBanner({
  index = 0,
  position = "sidebar",
  rankingKey,
  vertical,
  excludeAds = [],
}: SidebarPromoBannerProps) {
  if (!rankingKey || vertical !== "labor" || SIDEBAR_PROMO_BANNERS.length === 0) return null;
  const banner = SIDEBAR_PROMO_BANNERS[index % SIDEBAR_PROMO_BANNERS.length];
  if (!banner || (banner.targetRankingKeys?.length && !banner.targetRankingKeys.includes(rankingKey))) return null;
  if (isAffiliateDeliveryHeld(banner)) return null;
  if (isAffiliateDestinationExcluded(banner, excludeAds)) return null;

  return (
    <BannerAd
      href={banner.href}
      imageUrl={banner.imageUrl}
      trackingPixelUrl={banner.trackingPixelUrl}
      width={banner.width}
      height={banner.height}
      label={banner.label}
      category="labor"
      position={position}
      adId={banner.id}
    />
  );
}
