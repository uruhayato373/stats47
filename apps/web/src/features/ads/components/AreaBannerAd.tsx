import { CATEGORY_AFFILIATE_MAP } from "../constants/affiliate-category";
import { readActiveBannersByLocationFromR2 as findActiveBannersByLocation } from "../repositories/affiliate-ad-snapshot";

import { BannerAd } from "./BannerAd";

/**
 * エリアページ用バナー広告。
 * DB から area-sidebar スロットのバナーを1件取得して表示する。
 * 該当なしの場合は何も表示しない（AdSense フォールバックなし）。
 */
export async function AreaBannerAd() {
  const banners = await findActiveBannersByLocation("area-sidebar", 1);
  if (banners.length === 0) return null;

  const banner = banners[0];
  const affiliateCategory = banner.categoryKey
    ? CATEGORY_AFFILIATE_MAP[banner.categoryKey]
    : undefined;

  return (
    <BannerAd
      href={banner.htmlContent}
      imageUrl={banner.imageUrl!}
      trackingPixelUrl={banner.trackingPixelUrl}
      width={banner.width}
      height={banner.height}
      category={affiliateCategory ?? "other"}
      label={banner.title}
      position="area-sidebar"
    />
  );
}
