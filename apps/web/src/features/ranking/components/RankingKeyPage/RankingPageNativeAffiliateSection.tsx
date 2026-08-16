import { BannerAd, NativeAffiliateRow } from "@/features/ads";
import { isLandscapeBanner } from "@/features/ads/services/banner-geometry";
import type { ResolvedAffiliateBanner } from "@/features/ads/services/resolve-affiliate-ad";

interface RankingPageNativeAffiliateSectionProps {
  banners: ResolvedAffiliateBanner[];
  categoryKey?: string | null;
}

export function RankingPageNativeAffiliateSection({
  banners,
  categoryKey,
}: RankingPageNativeAffiliateSectionProps) {
  // AdSense 停止中は、呼び出し元が本文中段へ回した最優先の1件を除いて渡す。
  // ここでは残りを読了位置へ回し、同じ本文内で同一バナーを重複表示しない。
  // 縦長 (スカイスクレイパー) は本文枠に出さない。native の 4 件も末尾の 300x250 枠も
  // 横長前提のため、先に除外してから配分する (受け皿は sidebar-sticky スロット)。
  const usable = banners.filter(isLandscapeBanner);
  if (usable.length === 0) return null;

  // ★ 2026-08-04: ネイティブ枠の 4 件に加え、直後に 300x250 を 1 枚置く
  //   (読了位置の視認性が高い枠。在庫が 4 件以下なら描画しない = 同じ広告の重複を避ける)。
  const endBanner = usable[4] ?? null;

  return (
    <>
      <NativeAffiliateRow
        banners={usable.slice(0, 4)}
        position="ranking-native"
        trackingCategory={`ranking-${categoryKey ?? "general"}`}
      />
      {endBanner && (
        <div className="mt-4 flex justify-center">
          <BannerAd
            href={endBanner.href}
            imageUrl={endBanner.imageUrl}
            trackingPixelUrl={endBanner.trackingPixelUrl}
            width={endBanner.width}
            height={endBanner.height}
            label={endBanner.title}
            category={endBanner.vertical ?? "other"}
            position="ranking-end"
            adId={endBanner.id}
            creativeSize={`${endBanner.width}x${endBanner.height}`}
          />
        </div>
      )}
    </>
  );
}
