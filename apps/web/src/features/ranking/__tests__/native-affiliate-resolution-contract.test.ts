/**
 * ranking ページの native アフィリエイト解決契約。
 *
 * ## 背景 (2026-08-06 実測)
 *
 * ranking の native 枠は**一度も描画されたことがなかった**。解決が `RankingItem.tags`
 * だけを見ており、その SSOT である `MetricConfig.tags` は 2026-06-03 に型へ追加されて以来
 * **2,295 config すべてで未記入**だったため、常に空配列だった。型・builder・描画は
 * 揃っていたのに供給だけが無い「宣言されているが誰も書かない SSOT」で、型検査でも
 * lint でも検出できない。本番の item.json を実測して初めて判明した。
 *
 * 規約 (.claude/rules/affiliate-ads-standards.md §12) は ranking の解決キーを
 * 「categoryKey → vertical + tagKeys」と定めており、tagKeys 単独は規約違反でもある。
 *
 * ## 契約
 *
 * tagKeys で解決できないとき **categoryKey → vertical でフォールバックする**こと。
 * categoryKey は全 ranking item が持ち、`CATEGORY_AFFILIATE_MAP` が 17 軸すべてを
 * 写像するので、これがある限り在庫がある限り枠は埋まる。
 * themes が relatedArticleTagKeys → THEME_AFFILIATE_MAP でフォールバックするのと同型。
 *
 * 手本: features/ads/__tests__/right-rail-banner-contract.test.ts (ソース文字列検査)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ReactElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { resolveContentVerticalChain } from "@/features/ads/constants/affiliate-category";
import type { ResolvedAffiliateBanner } from "@/features/ads/types";

import { RankingPageClientShell } from "../components/RankingKeyPage/RankingPageClientShell";

import type { RankingPageModel } from "../services/load-ranking-page-model";

const display = vi.hoisted(() => ({ adsense: false }));
vi.mock("@/lib/google-adsense", () => ({
  get ADSENSE_DISPLAY_ENABLED() { return display.adsense; },
  RANKING_INCONTENT_MOBILE: { slotId: "mid", format: "article" },
  HUB_INCONTENT: { slotId: "hub", format: "article" },
  RANKING_PAGE_FOOTER: { slotId: "footer", format: "rectangle" },
}));
vi.mock("@/features/ads", async () => ({
  ...await import("@/features/ads/utils"),
  ...await import("@/features/ads/lib/ad-row"),
  AdRow: () => null,
}));
vi.mock("../funnel/RankingFunnelCta", () => ({ RankingFunnelCta: () => null }));
vi.mock("../components/RankingKeyPage/RankingKeyPageClient", () => ({ RankingKeyPageClient: () => null }));
vi.mock("../components/RankingKeyPage/RankingPageAiSections", () => ({
  RankingPageFaqSection: () => null, RankingPageInsightsSection: () => null,
}));
vi.mock("../components/RankingKeyPage/RankingPageAsyncSections", () => ({
  RankingPageCorrelationSection: () => null, RankingPageSupplementCardsSection: () => null,
}));
vi.mock("@/components/layout/Breadcrumbs", () => ({ Breadcrumbs: () => null }));
vi.mock("../components/RankingKeyPage/RankingPageNativeAffiliateSection", () => ({ RankingPageNativeAffiliateSection: () => null }));
vi.mock("../components/RankingKeyPage/RankingPageRelatedRankingsSection", () => ({ RankingPageRelatedRankingsSection: () => null }));
vi.mock("../components/RankingKeyPage/RankingPageSidebarSection", () => ({ RankingPageSidebarSection: () => null }));

const MODEL_SRC = readFileSync(
  resolve(import.meta.dirname, "../services/load-ranking-page-model.ts"),
  "utf8",
);
const SHELL_SRC = readFileSync(
  resolve(import.meta.dirname, "../components/RankingKeyPage/RankingPageClientShell.tsx"),
  "utf8",
);
const CONTENT_SRC = readFileSync(
  resolve(import.meta.dirname, "../components/RankingKeyPage/RankingPageContentSections.tsx"),
  "utf8",
);
const AFFILIATE_SECTION_SRC = readFileSync(
  resolve(
    import.meta.dirname,
    "../components/RankingKeyPage/RankingPageNativeAffiliateSection.tsx",
  ),
  "utf8",
);

describe("ranking native アフィリエイトの解決契約", () => {
  it("categoryKey を解決入力に必ず渡す (tags は全 config 未記入のため必須)", () => {
    // 2026-09-03: 解決は resolveContentVertical(Chain) に一本化された。model 側の契約は
    // 「categoryKey を入力に含めること」で、鎖の順序と在庫フォールバックは下の純関数テストが持つ。
    expect(MODEL_SRC).toContain("resolveAffiliateBannersForContent");
    expect(MODEL_SRC).toMatch(/categoryKey:\s*rankingItem\.categoryKey/);
  });

  it("tagKeys が空でも解決を打ち切らない", () => {
    // 旧実装は `affiliateTagKeys.length > 0 ? resolve(...) : Promise.resolve([])` で、
    // tags が空の全 ranking (= 全件) を無条件に空へ倒していた。この三項の復活を禁じる。
    expect(MODEL_SRC).not.toMatch(/affiliateTagKeys\.length\s*>\s*0\s*\n?\s*\?/);
  });

  it("tagKeys 解決が 0 件だったときも categoryKey を試す", () => {
    // 「tags があるが在庫が無い」ケースでも枠を落とさない。鎖に category 段が残ることを要求する。
    const chain = resolveContentVerticalChain({
      tagKeys: ["移住"],
      categoryKey: "economy",
    });
    expect(chain.blocked).toBe(false);
    expect(chain.steps.map((s) => s.source)).toEqual(["tags", "category"]);
  });

  it("出典調査が null の指標は下位段へフォールバックしない", () => {
    // 身長・気候など商材の無い調査。tags / categoryKey があっても意図軸の広告を出さない。
    const chain = resolveContentVerticalChain({
      surveyIds: ["school-health-survey"],
      tagKeys: ["移住"],
      categoryKey: "economy",
    });
    expect(chain.blocked).toBe(true);
    expect(chain.steps).toEqual([]);
  });

  it("解説の後と出典の後に広告の段を置き、解説の後は幅いっぱいの AdSense 1 つにする (2026-11-03・11-12)", () => {
    expect(SHELL_SRC).toContain("model.nativeBanners.filter(isLandscapeBanner)");
    expect(SHELL_SRC).toMatch(/position="ranking-row-1"[^/]*\bwide\b/);
    expect(SHELL_SRC).toContain('position="ranking-row-2"');
    expect(CONTENT_SRC).toContain("{sections.adRowMid}");
    expect(CONTENT_SRC).toContain("{sections.adRowFooter}");
  });

  type Cell = { kind: string; slot?: { slotId: string }; banner?: { id: string } };
  const cellIds = (row: ReactElement<{ cells: Cell[] }> | null) =>
    row ? row.props.cells.map((cell) => (cell.kind === "adsense" ? `adsense:${cell.slot?.slotId}` : cell.banner?.id)) : [];

  it.each([
    {
      adsense: true, rankingKey: "library-count",
      mid: ["adsense:mid"], footer: ["ad1", "adsense:footer", "ad2"], end: ["ad3", "ad4", "ad5"],
    },
    {
      // AdSense を止めているときは解説の後の段を出さない (PR で埋めない)
      adsense: false, rankingKey: "library-count",
      mid: [], footer: ["ad1", "ad2"], end: ["ad3", "ad4", "ad5"],
    },
  ])("段で使った広告を読了・レールから除く: $rankingKey / AdSense=$adsense", ({ adsense, rankingKey, mid, footer, end }) => {
    display.adsense = adsense;
    const nativeBanners: ResolvedAffiliateBanner[] = ["vertical", "ad1", "ad2", "ad3", "ad4", "ad5"].map((id) => ({
      id, title: id, href: `https://example.com/${id}`, imageUrl: `https://example.com/${id}.png`,
      width: 300, height: id === "vertical" ? 600 : 250, trackingPixelUrl: null, vertical: null,
    }));
    const model = { nativeBanners, rankingItem: { categoryKey: "education" } } as RankingPageModel;
    // 子コンポーネントの描画ではなく、shell が各配置へ渡す実データを検証する。
    const rendered = RankingPageClientShell({ rankingKey, model });
    const sections = rendered.props.sections as {
      adRowMid: ReactElement<{ cells: Cell[] }> | null;
      adRowFooter: ReactElement<{ cells: Cell[] }> | null;
      nativeAffiliate: ReactElement<{ banners: ResolvedAffiliateBanner[] }>;
      sidebar: ReactElement<{ excludeAffiliateAds: ResolvedAffiliateBanner[] }>;
    };
    expect(cellIds(sections.adRowMid)).toEqual(mid);
    expect(cellIds(sections.adRowFooter)).toEqual(footer);
    expect(sections.nativeAffiliate.props.banners.map((banner) => banner.id)).toEqual(end);
    const usedInRows = [...mid, ...footer].filter((id) => !id.startsWith("adsense:"));
    expect(sections.sidebar.props.excludeAffiliateAds.map((banner) => banner.id)).toEqual([...usedInRows, ...end]);
  });

  it("読了位置は3列の単一ブロックにし、独立した5件目を置かない", () => {
    expect(AFFILIATE_SECTION_SRC).toContain('variant="three-up"');
    expect(AFFILIATE_SECTION_SRC).not.toContain('position="ranking-end"');
    expect(AFFILIATE_SECTION_SRC).not.toContain("<BannerAd");
    expect(AFFILIATE_SECTION_SRC).not.toContain("usable[4]");
  });

  it("家計調査 (kakei-chousa) の本文中段 native は楽天カードへ置換する (2026-09-16)", () => {
    display.adsense = true;
    const nativeBanners: ResolvedAffiliateBanner[] = ["b1"].map((id) => ({
      id, title: id, href: `https://example.com/${id}`, imageUrl: `https://example.com/${id}.png`,
      width: 300, height: 250, trackingPixelUrl: null, vertical: null,
    }));
    const baseModel = {
      nativeBanners,
      rankingItem: { categoryKey: "economy" },
      affiliateVertical: "furusato" as const,
      rankingName: "納豆消費支出額",
      rankingValues: [
        { areaCode: "07000", areaName: "福島県", rank: 1, value: 100 },
        { areaCode: "01000", areaName: "北海道", rank: 2, value: 90 },
      ],
    };
    const kakeiModel = {
      ...baseModel,
      originalSurveys: [{ id: "kakei-chousa", name: "家計調査" }],
    } as RankingPageModel;
    const nonKakeiModel = {
      ...baseModel,
      originalSurveys: [{ id: "other-survey", name: "他調査" }],
    } as RankingPageModel;

    const kakeiRendered = RankingPageClientShell({ rankingKey: "natto-consumption-expenditure", model: kakeiModel });
    const kakeiSections = kakeiRendered.props.sections as {
      nativeAffiliate: ReactElement | null;
      adRowMid: ReactElement<{ cells: Cell[] }> | null;
      sidebar: ReactElement<{ excludeAffiliateAds: ResolvedAffiliateBanner[] }>;
    };
    // 楽天の商品カードは 2026-11-06 に撤去した。A8 も戻さず、下段の PR は出さない
    expect(kakeiSections.nativeAffiliate).toBeNull();
    // 広告の段の A8 も家計調査系では描画しない (2026-09-16 オーナー判断)。AdSense の枠だけが残る
    expect(cellIds(kakeiSections.adRowMid)).toEqual(["adsense:mid"]);

    const nonKakeiRendered = RankingPageClientShell({ rankingKey: "natto-consumption-expenditure", model: nonKakeiModel });
    const nonKakeiSections = nonKakeiRendered.props.sections as {
      adRowMid: ReactElement<{ cells: Cell[] }> | null;
      sidebar: ReactElement<{ excludeAffiliateAds: ResolvedAffiliateBanner[] }>;
    };
    expect(cellIds(nonKakeiSections.adRowMid)).toEqual(["adsense:mid"]);
    // 描画しなかった A8 も右レール除外 (usedAffiliateAds) には残す = レールへ流れ込ませない。
    expect(kakeiSections.sidebar.props.excludeAffiliateAds.map((banner) => banner.id)).toEqual(["b1"]);
    expect(kakeiSections.sidebar.props.excludeAffiliateAds.map((banner) => banner.id)).toEqual(
      nonKakeiSections.sidebar.props.excludeAffiliateAds.map((banner) => banner.id),
    );
  });
});
