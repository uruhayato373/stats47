import { BannerAd, NativeAffiliateRow } from "@/features/ads";
import type { ResolvedAffiliateBanner } from "@/features/ads/services/resolve-affiliate-ad";

interface RankingPageNativeAffiliateSectionProps {
  banners: ResolvedAffiliateBanner[];
  categoryName?: string | null;
  categoryKey?: string | null;
}

export function RankingPageNativeAffiliateSection({
  banners,
  categoryName,
  categoryKey,
}: RankingPageNativeAffiliateSectionProps) {
  if (banners.length === 0) return null;

  // ★ 2026-08-04: ネイティブ枠の 4 件に加え、直後に 300x250 を 1 枚置く
  //   (読了位置の視認性が高い枠。在庫が 4 件以下なら描画しない = 同じ広告の重複を避ける)。
  const endBanner = banners[4] ?? null;

  return (
    <>
      <NativeAffiliateRow
        title={`${categoryName ?? "このランキング"}に関連する商品・書籍`}
        description="統計データを深掘りするためのおすすめ書籍・関連商品"
        banners={banners.slice(0, 4)}
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
