import { SIDEBAR_PROMO_BANNERS } from "../constants/sidebar-banners";

import { BannerAd } from "./BannerAd";

interface SidebarPromoBannerProps {
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
}: SidebarPromoBannerProps) {
  if (SIDEBAR_PROMO_BANNERS.length === 0) return null;
  const banner = SIDEBAR_PROMO_BANNERS[index % SIDEBAR_PROMO_BANNERS.length];

  return (
    <BannerAd
      href={banner.href}
      imageUrl={banner.imageUrl}
      trackingPixelUrl={banner.trackingPixelUrl}
      width={banner.width}
      height={banner.height}
      label={banner.label}
      position={position}
      adId={banner.id}
    />
  );
}
