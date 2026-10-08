import { Children, isValidElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { RankingPageSidebarSection } from "@/features/ranking/components/RankingKeyPage/RankingPageSidebarSection";
import { RankingItemsSidebar } from "@/features/ranking/components/RankingSidebar";

import { RakutenItemsCard } from "../server";

vi.mock("../server", () => ({ AffiliateAdSlot: () => null, RakutenItemsCard: () => null }));
vi.mock("../index", () => ({
  SidebarPromoBanner: () => null,
  selectPromoBannerIndexForRanking: () => 0,
  RailAdSlot: () => null,
}));
vi.mock("@/features/ranking/components/RankingSidebar", () => ({ RankingItemsSidebar: () => null }));
vi.mock("@/features/ranking/components/RankingSidebar/PortStatisticsMapCard", () => ({ PortStatisticsMapCard: () => null }));
vi.mock("@/features/ranking/components/RankingSidebar/RelatedArticlesCard", () => ({ RelatedArticlesCard: () => null }));
vi.mock("@/features/ranking/components/RankingSidebar/SurveyCard", () => ({ SurveyCard: () => null }));

describe("家計調査の既存楽天カードを一度だけ優先表示", () => {
  it.each([
    { survey: "kakei-chousa", vertical: "furusato" as const, promoted: true },
    { survey: "school-health-survey", vertical: null, promoted: false },
    { survey: "kakei-chousa", vertical: null, promoted: false },
    { survey: "other-survey", vertical: "economy" as const, promoted: false },
  ])("$survey / $vertical", ({ survey, vertical, promoted }) => {
    const tree = RankingPageSidebarSection({
      rankingKey: "natto-consumption-expenditure", areaType: "prefecture",
      rankingItem: { categoryKey: "economy" },
      affiliateVertical: vertical, surveys: [{ id: survey, name: survey }], rankingName: "納豆消費量",
    });
    const children = Children.toArray(tree.props.children);
    const rankingIndex = children.findIndex((child) => isValidElement(child) && child.type === RankingItemsSidebar);

    if (!promoted) {
      // 非優先時はラップせず、他の要素に混じって bare で描画する。
      const cards = children.filter((child) => isValidElement(child) && child.type === RakutenItemsCard);
      expect(cards).toHaveLength(1);
      const card = cards[0];
      expect(isValidElement<{ position: string }>(card) && card.props.position).toBe("ranking-sidebar");
      expect(children.indexOf(card)).toBeGreaterThan(rankingIndex);
      return;
    }

    // 関連記事・テーマ・Geoの入口より後、関連ランキング直後へ優先表示する。
    // 本文中段のモバイル版と重複させない
    // デスクトップ限定 (hidden lg:block) のラッパーで囲む (2026-09-16)。
    const wrappers = children.filter((child) => {
      if (!isValidElement<{ children?: unknown }>(child)) return false;
      const nested = child.props.children;
      return isValidElement(nested) && nested.type === RakutenItemsCard;
    });
    expect(wrappers).toHaveLength(1);
    const wrapper = wrappers[0];
    expect(children.indexOf(wrapper)).toBe(rankingIndex + 1);
    expect(children.filter((child) => isValidElement(child) && child.type === RakutenItemsCard)).toHaveLength(0);
    expect(isValidElement<{ className: string }>(wrapper) && wrapper.props.className).toBe("hidden lg:block");
    const wrapped = isValidElement<{ children: unknown }>(wrapper) ? wrapper.props.children : null;
    expect(isValidElement(wrapped) && wrapped.type === RakutenItemsCard).toBe(true);
    expect(isValidElement<{ position: string }>(wrapped) && wrapped.props.position).toBe("rakuten-sidebar");
  });
});
