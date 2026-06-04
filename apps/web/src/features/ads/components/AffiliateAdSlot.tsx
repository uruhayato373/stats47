import {
  RANKING_PAGE_FOOTER,
  RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

import { CATEGORY_AFFILIATE_MAP } from "../constants/affiliate-category";
import {
  resolveAffiliateBannersByCategoryKey,
  resolveAffiliateTextAds,
} from "../services";

import { AdSenseAdWrapper } from "./AdSenseAdWrapper";
import { AffiliateTextAdList } from "./AffiliateTextAdList";
import { BannerAd } from "./BannerAd";

import type { AffiliateLocationCode } from "../types";

interface AffiliateAdSlotProps {
  categoryKey: string;
  position?: "sidebar" | "footer";
}

function mapPositionToLocation(position: "sidebar" | "footer"): AffiliateLocationCode {
  return position === "footer" ? "footer" : "sidebar-bottom";
}

/**
 * アフィリエイト広告スロット。
 *
 * 優先順位 (AFF-03 でバナーを最優先に追加):
 * 1. バナー広告 (sidebar のみ・categoryKey 一致の上位1件) — 視認性が高く impression を稼ぐ
 * 2. テキスト広告 (最大 2 件)
 * 3. なければ AdSense にフォールバック
 *
 * バナー在庫の無いカテゴリ (広告ゼロ8軸など) は 2→3 に流れるため従来挙動と同じ。
 * 本コンポーネントは async Server Component で R2 を build 時に解決する
 * (cookies()/headers() を使わないため SSG を壊さない: nextjs-ssg-preservation.md)。
 */
export async function AffiliateAdSlot({
  categoryKey,
  position = "sidebar",
}: AffiliateAdSlotProps) {
  const locationCode = mapPositionToLocation(position);
  const affiliateCategory = CATEGORY_AFFILIATE_MAP[categoryKey] ?? null;

  // 1. バナー優先 (sidebar のみ)。ranking の主要トラフィックに視認性の高い枠を出す。
  if (position === "sidebar") {
    const banners = await resolveAffiliateBannersByCategoryKey(categoryKey, 1);
    const banner = banners[0];
    if (banner) {
      return (
        <BannerAd
          href={banner.href}
          imageUrl={banner.imageUrl}
          trackingPixelUrl={banner.trackingPixelUrl}
          width={banner.width}
          height={banner.height}
          category={affiliateCategory ?? "other"}
          label={banner.title}
          position="ranking-sidebar"
        />
      );
    }
  }

  // 2. テキスト広告
  const ads = await resolveAffiliateTextAds(categoryKey, locationCode, 2);
  if (ads.length > 0) {
    return (
      <AffiliateTextAdList ads={ads} affiliateCategory={affiliateCategory} position={position} />
    );
  }

  // 3. AdSense フォールバック
  const adSlot =
    position === "footer" ? RANKING_PAGE_FOOTER : RANKING_PAGE_TABLE_SIDE;

  return (
    <AdSenseAdWrapper
      format={adSlot.format}
      slotId={adSlot.slotId}
    />
  );
}
