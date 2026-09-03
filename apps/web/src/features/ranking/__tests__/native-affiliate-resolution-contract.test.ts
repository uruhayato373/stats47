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

import { describe, expect, it } from "vitest";

import { resolveContentVerticalChain } from "@/features/ads/constants/affiliate-category";

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

  it("AdSense停止中は先頭の横長バナー1件を本文中段へ配線し、末尾で重複させない", () => {
    expect(SHELL_SRC).toContain("model.nativeBanners.filter(isLandscapeBanner)");
    expect(SHELL_SRC).toMatch(/shouldShowRankingInContentAffiliate\(\s*rankingKey\s*\)/);
    expect(SHELL_SRC).toContain('position="ranking-incontent"');
    expect(SHELL_SRC).toMatch(
      /ADSENSE_DISPLAY_ENABLED\s*\?\s*affiliateBanners\s*:\s*affiliateBanners\.slice\(1\)/,
    );
    expect(CONTENT_SRC).toContain("!ADSENSE_DISPLAY_ENABLED && sections.inContentAffiliate");
  });

  it("読了位置は3列の単一ブロックにし、独立した5件目を置かない", () => {
    expect(AFFILIATE_SECTION_SRC).toContain('variant="three-up"');
    expect(AFFILIATE_SECTION_SRC).not.toContain('position="ranking-end"');
    expect(AFFILIATE_SECTION_SRC).not.toContain("<BannerAd");
    expect(AFFILIATE_SECTION_SRC).not.toContain("usable[4]");
  });
});
