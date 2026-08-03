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
 *
 * padding は `p-2` 固定。右レール 316px から左右 8px を引いた 300px が
 * `SIDEBAR_PROMO_BANNERS` の 300×250 と等倍で一致する (doboku-note と同じ寸法設計)。
 * ここを広げるとバナー画像が `max-w-full` で縮小され、等倍でなくなる。
 */
export function SidebarPromoBanner({
  index = 0,
  position = "sidebar",
}: SidebarPromoBannerProps) {
  if (SIDEBAR_PROMO_BANNERS.length === 0) return null;
  const banner = SIDEBAR_PROMO_BANNERS[index % SIDEBAR_PROMO_BANNERS.length];

  return (
    <SurfaceCard className="p-2">
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
