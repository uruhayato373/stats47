import { Children, isValidElement, type ComponentProps, type ReactElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { RelatedContentNavigation } from "@/features/content-navigation/RelatedContentNavigation";

import { RankingPageSidebarSection } from "../RankingPageSidebarSection";

import type { ContentRecommendation } from "@stats47/data-configs/content/navigation";

vi.mock("@/features/ads", () => ({
  RailAdSlot: () => null,
  SidebarPromoBanner: () => null,
  selectPromoBannerIndexForRanking: () => 0,
}));
vi.mock("@/features/ads/server", () => ({ AffiliateAdSlot: () => null, RakutenItemsCard: () => null }));
vi.mock("@/features/theme-dashboard/server", () => ({ listRelatedThemesForRankingKeys: () => [] }));
vi.mock("@/features/blog/server", () => ({ readNavigationArticlesFromR2: async () => [] }));
vi.mock("../../RankingSidebar", () => ({ RankingItemsSidebar: () => null }));
vi.mock("../../RankingSidebar/PortStatisticsMapCard", () => ({ PortStatisticsMapCard: () => null }));
vi.mock("../../RankingSidebar/RelatedArticlesCard", () => ({ RelatedArticlesCard: () => null }));
vi.mock("../../RankingSidebar/SurveyCard", () => ({ SurveyCard: () => null }));

type NavigationProps = ComponentProps<typeof RelatedContentNavigation>;
async function geoLinks(rankingKey: string, areaType: "prefecture" | "city" = "prefecture"): Promise<ContentRecommendation[]> {
  const tree = RankingPageSidebarSection({
    rankingKey,
    areaType,
    rankingItem: { categoryKey: "landweather" },
    affiliateVertical: null,
    surveys: [],
    rankingName: "テスト",
  });
  const sections = Children.toArray(tree.props.children).filter(
    (child): child is ReactElement<NavigationProps> =>
      isValidElement<NavigationProps>(child) && child.type === RelatedContentNavigation && child.props.surface === "ranking_geo"
  );
  const resolved = await Promise.all(sections.map((section) => RelatedContentNavigation(section.props)));
  return resolved.flatMap((section) => section.props.items);
}

describe("ランキングページから地域分析の着地ページへ辿れる", () => {
  it("標高×人口の主指標のランキングは、分析のcanonical着地への導線を1つだけ出す", async () => {
    const links = await geoLinks("low-elevation-population-ratio-5m");
    expect(links).toHaveLength(1);
    expect(links.map((item) => item.href)).toEqual(["/geo/population-low-elevation"]);
    expect(links[0]!.id).toBe("geo:population-low-elevation");
  });

  it("分析と結び付かないランキングや市区町村ランキングには出さない", async () => {
    expect(await geoLinks("natto-consumption-expenditure")).toHaveLength(0);
    expect(await geoLinks("low-elevation-population-ratio-5m", "city")).toHaveLength(0);
  });
});
