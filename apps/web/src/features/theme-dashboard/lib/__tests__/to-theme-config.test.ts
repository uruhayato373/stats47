import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { POPULATION_DYNAMICS_SET, type IndicatorSet } from "@stats47/types";
import { describe, it, expect } from "vitest";

import { toThemeConfig } from "../to-theme-config";

const makeIndicatorSet = (overrides: Partial<IndicatorSet> = {}): IndicatorSet => ({
  key: "test-theme",
  title: "テストテーマ",
  description: "テーマの説明",
  metrics: [
    { rankingKey: "primary-key", shortLabel: "主指標", role: "primary" },
    { rankingKey: "secondary-key", shortLabel: "副指標", role: "secondary" },
    { rankingKey: "context-key", shortLabel: "コンテキスト", role: "context" },
  ],
  keywords: ["テスト", "テーマ"],
  ...overrides,
} as IndicatorSet);

describe("toThemeConfig", () => {
  it("IndicatorSet を ThemeConfig に変換する", () => {
    const set = makeIndicatorSet();
    const config = toThemeConfig(set);

    expect(config.themeKey).toBe("test-theme");
    expect(config.title).toBe("テストテーマ");
    expect(config.description).toBe("テーマの説明");
    expect(config.keywords).toEqual(["テスト", "テーマ"]);
  });

  it("rankingKeys に全指標の rankingKey を含む", () => {
    const config = toThemeConfig(makeIndicatorSet());

    expect(config.rankingKeys).toEqual([
      "primary-key",
      "secondary-key",
      "context-key",
    ]);
  });

  it("defaultRankingKey は role=primary の指標", () => {
    const config = toThemeConfig(makeIndicatorSet());

    expect(config.defaultRankingKey).toBe("primary-key");
  });

  it("primary がない場合は先頭の指標を defaultRankingKey にする", () => {
    const set = makeIndicatorSet({
      metrics: [
        { rankingKey: "first-key", shortLabel: "1番目", role: "secondary" },
        { rankingKey: "second-key", shortLabel: "2番目", role: "secondary" },
      ] as IndicatorSet["metrics"],
    });
    const config = toThemeConfig(set);

    expect(config.defaultRankingKey).toBe("first-key");
  });

  it("tabIndicators は context を除外する", () => {
    const config = toThemeConfig(makeIndicatorSet());

    expect(config.tabIndicators).toHaveLength(2);
    expect(config.tabIndicators.map((t) => t.rankingKey)).toEqual([
      "primary-key",
      "secondary-key",
    ]);
  });
});

/** 人口規模と増減の入口と、拡充した出生・移動の章を分ける。 */
describe("population-dynamics の指標カード", () => {
  it("出生年齢・順位の追加指標は専用章に接続する", () => {
    const catalog = THEME_CATALOGS["population-dynamics"];
    const section = catalog.sections!.find((entry) => entry.key === "candidate-41")!;
    const keys = section.metricGroupKeys.flatMap((key) => catalog.metricGroups!.find((group) => group.key === key)!.rankingKeys);
    expect(keys).toEqual(expect.arrayContaining(["births", "total-fertility-rate", "births-mother-under25", "births-third-child-plus"]));
    const config = toThemeConfig(POPULATION_DYNAMICS_SET);
    for (const key of keys) expect(config.tabIndicators.some((tab) => tab.rankingKey === key)).toBe(true);
  });
  it("規模・増減の入口は総人口 / 人口増減率 / 自然増減率", () => {
    const config = toThemeConfig(POPULATION_DYNAMICS_SET);

    const catalog = THEME_CATALOGS["population-dynamics"];
    const entryKeys = catalog.sections!
      .filter((section) => ["population-change", "natural-social-change"].includes(section.key))
      .flatMap((section) => section.metricGroupKeys)
      .flatMap((key) => catalog.metricGroups!.find((group) => group.key === key)!.rankingKeys);
    expect(new Set(entryKeys)).toEqual(new Set([
      "total-population", "population-growth-rate", "natural-increase-rate",
    ]));
    for (const key of entryKeys) expect(config.tabIndicators.some((tab) => tab.rankingKey === key)).toBe(true);

  });

  it("人口構造などの補足6指標はカードへ重複表示しない", () => {
    const config = toThemeConfig(POPULATION_DYNAMICS_SET);
    const shown = new Set(config.tabIndicators.map((t) => t.rankingKey));

    for (const key of [
      "moving-in-excess-rate",
      "ratio-65-plus",
      "crude-birth-rate",
      "crude-death-rate",
      "social-increase-rate",
      "young-population-ratio",
    ]) {
      // 指標カードには出さないが、全指標セクションとランキングページには残す
      expect(shown.has(key)).toBe(false);
      expect(config.rankingKeys).toContain(key);
    }
  });
});
