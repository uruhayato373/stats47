import { describe, it, expect } from "vitest";

import { toThemeConfig } from "../to-theme-config";

import type { IndicatorSet } from "@stats47/types";

const makeIndicatorSet = (overrides: Partial<IndicatorSet> = {}): IndicatorSet => ({
  key: "test-theme",
  title: "テストテーマ",
  description: "テーマの説明",
  indicators: [
    { rankingKey: "primary-key", shortLabel: "主指標", role: "primary" },
    { rankingKey: "secondary-key", shortLabel: "副指標", role: "secondary" },
    { rankingKey: "context-key", shortLabel: "コンテキスト", role: "context" },
  ],
  keywords: ["テスト", "テーマ"],
  panelTabs: undefined,
  ...overrides,
} as IndicatorSet);

describe("toThemeConfig", () => {
  it("IndicatorSet を ThemeConfig に変換する", () => {
    const set = makeIndicatorSet();
    const config = toThemeConfig(set);

    expect(config.themeKey).toBe("test-theme");
    expect(config.title).toBe("テストテーマの統計ダッシュボード");
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
      indicators: [
        { rankingKey: "first-key", shortLabel: "1番目", role: "secondary" },
        { rankingKey: "second-key", shortLabel: "2番目", role: "secondary" },
      ] as IndicatorSet["indicators"],
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
