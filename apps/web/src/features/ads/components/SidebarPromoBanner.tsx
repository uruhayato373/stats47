import { SurfaceCard } from "@/components/surface";

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
 * Card でラップし他のサイドバーウィジェットと見た目を統一する。
 */
export function SidebarPromoBanner({
  index = 0,
  position = "sidebar",
}: SidebarPromoBannerProps) {
  if (SIDEBAR_PROMO_BANNERS.length === 0) return null;
  const banner = SIDEBAR_PROMO_BANNERS[index % SIDEBAR_PROMO_BANNERS.length];

  return (
    <SurfaceCard className="p-3">
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
    </SurfaceCard>
  );
}
