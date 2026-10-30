"use client";

import { ThemeMetricsDashboard } from "./ThemeMetricsDashboard";
import { useThemePrefecture } from "./ThemePrefectureContext";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component。指標カード・章のチャート・考察・比較をまとめた
 * ThemeMetricsDashboard を、選択中の県 (ThemePrefectureContext) とともに描く。
 *
 * 2026-10-30: テーマ専用の地図のタブ (ThemeDashboardTabbed の地図・指標タブ・年度セレクタ) を撤去した。
 * 2026-06-20 から全テーマで隠していて (hideMap)、どのテーマでも表示されていなかった。都道府県の地図と表は
 * ランキングと同じ部品 (RankingVisualizationSection) を ThemeComparisonSection が使う (専用の部品を持たない。オーナー決定)。
 */
export function ThemeDashboardClient({
  themeConfig,
  metricGroups,
  sections,
  embeddedSections,
  indicatorDataMap,
  pageCharts,
  chartSourceLinks,
}: ThemeDashboardClientProps) {
  const { selectedPrefectureCode } = useThemePrefecture();
  return (
    <div className="min-w-0 space-y-4">
      <ThemeMetricsDashboard
        themeConfig={themeConfig}
        metricGroups={metricGroups}
        sections={sections}
        embeddedSections={embeddedSections}
        indicatorDataMap={indicatorDataMap}
        pageCharts={pageCharts}
        chartSourceLinks={chartSourceLinks}
        selectedPrefectureCode={selectedPrefectureCode}
      />
    </div>
  );
}
