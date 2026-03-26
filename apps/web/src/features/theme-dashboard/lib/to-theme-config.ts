import type { IndicatorSet } from "@stats47/types";

import type { PanelTabGroup, ThemeConfig } from "../types";

/**
 * IndicatorSet → ThemeConfig 変換
 *
 * IndicatorSet の indicators / panelTabs から
 * ThemeConfig のフィールドを導出する。
 *
 * - tabIndicators: role が "context" でない指標を抽出
 * - rankingKeys: 全指標の rankingKey
 * - defaultRankingKey: role="primary" の先頭、なければ indicators[0]
 * - panelTabs: そのまま渡す（型構造が同一）
 */
export function toThemeConfig(set: IndicatorSet): ThemeConfig {
  const tabIndicators = set.indicators
    .filter((i) => i.role !== "context")
    .map((i) => ({
      rankingKey: i.rankingKey,
      tabLabel: i.shortLabel,
    }));

  const rankingKeys = set.indicators.map((i) => i.rankingKey);

  const primaryIndicator = set.indicators.find((i) => i.role === "primary");
  const defaultRankingKey =
    primaryIndicator?.rankingKey ?? set.indicators[0].rankingKey;

  return {
    themeKey: set.key,
    title: `${set.title}の統計ダッシュボード`,
    description: set.description,
    rankingKeys,
    defaultRankingKey,
    keywords: set.keywords ?? [],
    tabIndicators,
    panelTabs: set.panelTabs as PanelTabGroup[] | undefined,
  };
}
