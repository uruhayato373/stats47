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

/**
 * population-dynamics の指標カード枚数。
 *
 * ★2026-08-04 に 10 → 4 へ削減した。削減の理由は「下のチャートと同じ事実を二度見せない」
 * ことで、カタログの role を context に落として実現している。role は生成物 (IndicatorSet) 経由で
 * ここに効くため、カタログ編集や再生成の巻き戻しで黙って 10 枚に戻りうる。ここで枚数と
 * 顔ぶれを固定する。増減させたいときはこのテストを意図的に更新すること。
 */
describe("population-dynamics の指標カード", () => {
  it("role≠context は 4 指標 (総人口 / 出生率 / 転入超過 / 高齢化)", () => {
    const config = toThemeConfig(POPULATION_DYNAMICS_SET);

    expect(config.tabIndicators.map((t) => t.rankingKey)).toEqual([
      "total-population",
      "total-fertility-rate",
      "moving-in-excess-rate",
      "ratio-65-plus",
    ]);
  });

  it("チャートと重複する 6 指標は context に落ちている", () => {
    const config = toThemeConfig(POPULATION_DYNAMICS_SET);
    const shown = new Set(config.tabIndicators.map((t) => t.rankingKey));

    for (const key of [
      "population-growth-rate",
      "natural-increase-rate",
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
