import { Children, isValidElement, type ReactElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { RailLinksCard } from "@/components/rail";

import { RankingPageSidebarSection } from "../RankingPageSidebarSection";

vi.mock("@/features/ads", () => ({
  RailAdSlot: () => null,
  SidebarPromoBanner: () => null,
  selectPromoBannerIndexForRanking: () => 0,
}));
vi.mock("@/features/ads/server", () => ({ AffiliateAdSlot: () => null, RakutenItemsCard: () => null }));
vi.mock("@/features/theme-dashboard/server", () => ({ listRelatedThemesForRankingKeys: () => [] }));
vi.mock("../../RankingSidebar", () => ({ RankingItemsSidebar: () => null }));
vi.mock("../../RankingSidebar/PortStatisticsMapCard", () => ({ PortStatisticsMapCard: () => null }));
vi.mock("../../RankingSidebar/RelatedArticlesCard", () => ({ RelatedArticlesCard: () => null }));
vi.mock("../../RankingSidebar/SurveyCard", () => ({ SurveyCard: () => null }));

type RailProps = { trackingSurface: string; items: { href: string }[] };
function geoCards(rankingKey: string, areaType: "prefecture" | "city" = "prefecture") {
  const tree = RankingPageSidebarSection({
    rankingKey,
    areaType,
    rankingItem: { categoryKey: "landweather" },
    affiliateVertical: null,
    surveys: [],
    rankingName: "テスト",
  });
  return Children.toArray(tree.props.children).filter(
    (child): child is ReactElement<RailProps> =>
      isValidElement(child) && child.type === RailLinksCard && (child.props as RailProps).trackingSurface === "ranking_geo"
  );
}

describe("ランキングページから地域分析の着地ページへ辿れる", () => {
  it("標高×人口の主指標のランキングは、分析のcanonical着地への導線を1つだけ出す", () => {
    const cards = geoCards("low-elevation-population-ratio-5m");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.props.items.map((item) => item.href)).toEqual(["/geo/population-low-elevation"]);
  });

  it("分析と結び付かないランキングや市区町村ランキングには出さない", () => {
    expect(geoCards("natto-consumption-expenditure")).toHaveLength(0);
    expect(geoCards("low-elevation-population-ratio-5m", "city")).toHaveLength(0);
  });
});
