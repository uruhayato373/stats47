// @vitest-environment node
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

import { RankingPageClientShell } from "../components/RankingKeyPage/RankingPageClientShell";

import type { RankingPageModel } from "../services/load-ranking-page-model";

const display = vi.hoisted(() => ({ adsense: false }));
vi.mock("@/lib/google-adsense", () => ({
  get ADSENSE_DISPLAY_ENABLED() { return display.adsense; },
  RANKING_INCONTENT_MOBILE: { slotId: "mid", format: "article" },
  HUB_INCONTENT: { slotId: "hub", format: "article" },
  RANKING_PAGE_FOOTER: { slotId: "footer", format: "rectangle" },
  RANKING_PAGE_END: { slotId: "end", format: "rectangle" },
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
vi.mock("../components/RankingKeyPage/RankingPageRelatedRankingsSection", () => ({ RankingPageRelatedRankingsSection: () => null }));
vi.mock("../components/RankingKeyPage/RankingPageSidebarSection", () => ({ RankingPageSidebarSection: () => null }));

const SHELL_SRC = readFileSync(
  resolve(import.meta.dirname, "../components/RankingKeyPage/RankingPageClientShell.tsx"),
  "utf8",
);
const CONTENT_SRC = readFileSync(
  resolve(import.meta.dirname, "../components/RankingKeyPage/RankingPageContentSections.tsx"),
  "utf8",
);

describe("ranking native アフィリエイトの解決契約", () => {
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

  it("本文の広告の段は 3 段とも幅いっぱいの AdSense 1 つにする (2026-11-03・11-12)", () => {
    expect(SHELL_SRC).toMatch(/position="ranking-row-1"[^/]*\bwide\b/);
    expect(SHELL_SRC).toMatch(/position="ranking-row-2"[^/]*\bwide\b/);
    expect(SHELL_SRC).toMatch(/position="ranking-row-end"[^/]*\bwide\b/);
    expect(CONTENT_SRC).toContain("{sections.adRowMid}");
    expect(CONTENT_SRC).toContain("{sections.adRowFooter}");
    expect(CONTENT_SRC).toContain("{sections.adRowEnd}");
  });

  type Cell = { kind: string; slot?: { slotId: string }; banner?: { id: string } };
  const cellIds = (row: ReactElement<{ cells: Cell[] }> | null) =>
    row ? row.props.cells.map((cell) => (cell.kind === "adsense" ? `adsense:${cell.slot?.slotId}` : cell.banner?.id)) : [];

  // 2026-11-12 オーナー決定: アフィリエイトは戦略を決め直すまで止め、本文の 3 段は AdSense だけ。
  // 在庫や出典調査 (家計調査かどうか) に関係なく同じ段になり、AdSense を止めているときは段を出さない (PR で埋めない)
  it.each([
    { adsense: true, survey: "kakei-chousa", rows: [["adsense:mid"], ["adsense:footer"], ["adsense:end"]] },
    { adsense: true, survey: "other-survey", rows: [["adsense:mid"], ["adsense:footer"], ["adsense:end"]] },
    { adsense: false, survey: "other-survey", rows: [[], [], []] },
  ])("本文の段に PR を出さない: 出典調査=$survey / AdSense=$adsense", ({ adsense, survey, rows }) => {
    display.adsense = adsense;
    const model = {
      rankingItem: { categoryKey: "economy" },
      originalSurveys: [{ id: survey, name: survey }],
    } as RankingPageModel;
    // 子コンポーネントの描画ではなく、shell が各配置へ渡す実データを検証する。
    const sections = RankingPageClientShell({ rankingKey: "natto-consumption-expenditure", model }).props.sections as {
      adRowMid: ReactElement<{ cells: Cell[] }> | null;
      adRowFooter: ReactElement<{ cells: Cell[] }> | null;
      adRowEnd: ReactElement<{ cells: Cell[] }> | null;
    };
    expect([sections.adRowMid, sections.adRowFooter, sections.adRowEnd].map(cellIds)).toEqual(rows);
  });
});
