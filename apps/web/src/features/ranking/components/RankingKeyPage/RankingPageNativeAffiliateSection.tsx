import { NativeAffiliateRow } from "@/features/ads";
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
  // 縦長 (スカイスクレイパー) は本文枠に出さない (受け皿は sidebar-sticky スロット)。
  const usable = banners.filter(isLandscapeBanner);
  if (usable.length === 0) return null;

  return (
    <NativeAffiliateRow
      banners={usable}
      position="ranking-native"
      trackingCategory={`ranking-${categoryKey ?? "general"}`}
      variant="three-up"
    />
  );
}
