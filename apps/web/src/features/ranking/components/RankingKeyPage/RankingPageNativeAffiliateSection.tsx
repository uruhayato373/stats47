import { NativeAffiliateRow } from "@/features/ads";
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

  return (
    <NativeAffiliateRow
      title={`${categoryName ?? "このランキング"}に関連する商品・書籍`}
      description="統計データを深掘りするためのおすすめ書籍・関連商品"
      banners={banners}
      position="ranking-native"
      trackingCategory={`ranking-${categoryKey ?? "general"}`}
    />
  );
}
