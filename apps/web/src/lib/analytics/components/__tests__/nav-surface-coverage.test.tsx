/**
 * 導線名の無かった上位の部品に導線名を付けた (NAV-CLICK-COVERAGE-01・2026-10-19)。
 * W41 の計測で nav_click の 53.9% が導線名なし (unlabeled) で、どの部品から回遊したかが読めなかった。
 * 守ること: 部品を描画したとき、中のサイト内リンクを共通のクリック監視が unlabeled ではなく部品の導線名で送る。
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryRankingTable } from "@/features/ranking/components/CategoryRankingList/CategoryRankingListClient";
import { CorrelationSectionClient } from "@/features/ranking/components/CorrelationSection/CorrelationSectionClient";

import { navSurfaceProps } from "@/lib/analytics/events";

import { resolveNavClick } from "../NavClickTracker";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const LOCATION = {
  href: "http://localhost:3000/ranking/foo",
  origin: "http://localhost:3000",
  pathname: "/ranking/foo",
};

function surfacesOf(container: HTMLElement): string[] {
  return [...container.querySelectorAll("a[href]")].map(
    (anchor) => resolveNavClick(anchor, LOCATION)?.surface ?? "(not sent)",
  );
}

describe("導線名を付けた部品", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("navSurfaceProps は共通のクリック監視が読む data-nav-surface を返す", () => {
    expect(navSurfaceProps("ranking_table")).toEqual({ "data-nav-surface": "ranking_table" });
  });

  it("相関が高い指標のリンクは、ランキングも解説記事も ranking_correlation で送る", () => {
    const { container } = render(
      <CorrelationSectionClient
        correlatedItems={[
          {
            rankingKey: "bar",
            title: "別の指標",
            subtitle: null,
            unit: "%",
            pearsonR: 0.8,
            populationAdjustedR: 0.7,
            partialRPopulation: null,
            partialRArea: null,
            partialRAging: null,
            partialRDensity: null,
            scatterData: [],
          },
        ]}
        articleByPairKey={{ bar: { slug: "foo-vs-bar", title: "解説" } }}
      />,
    );
    const surfaces = surfacesOf(container);
    expect(surfaces.length).toBeGreaterThanOrEqual(2);
    expect(new Set(surfaces)).toEqual(new Set(["ranking_correlation"]));
  });

  it("カテゴリのランキング一覧のリンクは category_ranking_list で送る", () => {
    const { container } = render(
      <CategoryRankingTable
        items={[
          {
            rankingKey: "bar",
            areaType: "prefecture",
            title: "別の指標",
            subtitle: null,
            latestYear: "2024",
            unit: "%",
            description: null,
            demographicAttr: null,
            normalizationBasis: null,
          },
        ]}
      />,
    );
    const rankingLinks = [...container.querySelectorAll('a[href="/ranking/bar"]')];
    expect(rankingLinks.length).toBe(1);
    expect(resolveNavClick(rankingLinks[0], LOCATION)?.surface).toBe("category_ranking_list");
  });
});
