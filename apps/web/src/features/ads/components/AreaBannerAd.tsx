import { adVertical } from '../constants/affiliate-category';
import {
  isAffiliateDestinationExcluded,
  type AffiliateDestination,
} from '../constants/affiliate-delivery-policy';
import { readActiveBannersByLocationFromR2 as findActiveBannersByLocation } from '../repositories/affiliate-ad-snapshot';

import { BannerAd } from './BannerAd';

import type { ResolvedAffiliateBanner } from '../types';


/**
 * エリアページ用バナー広告。
 * area-sidebar スロットのバナーを priority 降順で最大2件表示する。
 * 該当なしの場合は何も表示しない（AdSense フォールバックなし）。
 */
export async function AreaBannerAd({
  excludeAds = [],
  candidates,
}: {
  excludeAds?: readonly AffiliateDestination[];
  candidates?: readonly ResolvedAffiliateBanner[];
} = {}) {
  const resolvedCandidates =
    candidates ??
    (await findActiveBannersByLocation('area-sidebar', Infinity)).map(
      (banner) => ({
        ...(banner.programRef ? { programRef: banner.programRef } : {}),
        id: banner.id,
        title: banner.title,
        href: banner.htmlContent,
        imageUrl: banner.imageUrl!,
        trackingPixelUrl: banner.trackingPixelUrl,
        width: banner.width ?? 300,
        height: banner.height ?? 250,
        vertical: adVertical(banner) ?? null,
      })
    );
  const banners = resolvedCandidates
    .filter((banner) => !isAffiliateDestinationExcluded(banner, excludeAds))
    .slice(0, 2);
  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {banners.map((banner) => {
        return (
          <BannerAd
            key={banner.id}
            href={banner.href}
            imageUrl={banner.imageUrl}
            trackingPixelUrl={banner.trackingPixelUrl}
            width={banner.width}
            height={banner.height}
            category={banner.vertical ?? 'other'}
            label={banner.title}
            position="area-sidebar"
            adId={banner.id}
          />
        );
      })}
    </div>
  );
}
