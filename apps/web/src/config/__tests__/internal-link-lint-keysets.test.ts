import { listCategories } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { KNOWN_THEME_SLUGS } from "../known-theme-slugs";

 
const { __loadKeySetsForTest } = await import(
  "../../../../../.claude/scripts/lib/internal-link-lint.mjs"
);

/**
 * internal-link-lint.mjs は Edge/CI どこでも動くよう、TS を実行せずに repo のファイルを
 * 正規表現で読んで key 集合を作っている (ネットワーク不要・pre-commit で一瞬で終わるため)。
 * そのため **正典がリネームされても lint 側は黙って別物を見続ける**リスクがある。
 *
 * テーマは ThemeCatalog が生成した IndicatorSet の JSON key を使う。
 * 実行時の KNOWN_THEME_SLUGS と突合し、追加漏れ・古い生成物を検出する。
 */
describe("internal-link-lint の key 集合", () => {
  it("themes: 生成 IndicatorSet の theme key が KNOWN_THEME_SLUGS と完全一致する", () => {
    const { themes } = __loadKeySetsForTest();
    expect(themes).toEqual(new Set(KNOWN_THEME_SLUGS));
  });

  it("category: 導出キーが data-configs の CATEGORIES と完全一致する", () => {
    const { categories } = __loadKeySetsForTest();
    const current = new Set(listCategories().map((c) => c.categoryKey));
    expect(categories).toEqual(current);
  });

  it("ranking: KNOWN_RANKING_KEYS を読めている (パース失敗で空集合になっていない)", () => {
    // 空集合だと lint は「全リンクが正常」と誤って黙り込む (fail-open) ため、
    // 実在キーを 1 つ含むことと規模で健全性を確認する。
    const { rankingKnown } = __loadKeySetsForTest();
    expect(rankingKnown.size).toBeGreaterThan(1000);
    expect(rankingKnown.has("total-population")).toBe(true);
  });

  it("gone: GONE_RANKING_KEYS を読めている", () => {
    const { rankingGone } = __loadKeySetsForTest();
    expect(rankingGone.size).toBeGreaterThan(100);
  });

  it("areas: 47 都道府県コードが揃っている", () => {
    const { areaCodes } = __loadKeySetsForTest();
    expect(areaCodes.size).toBe(47);
    expect(areaCodes.has("01000")).toBe(true);
    expect(areaCodes.has("47000")).toBe(true);
  });
});
