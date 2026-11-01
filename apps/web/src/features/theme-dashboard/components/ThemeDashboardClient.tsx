"use client";

import { ThemeMetricsDashboard } from "./ThemeMetricsDashboard";
import { useThemePrefecture } from "./ThemePrefectureContext";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component。指標カード・章のチャート・考察をまとめた
 * ThemeMetricsDashboard を、選択中の県 (ThemePrefectureContext) とともに描く。
 *
 * 2026-10-30: テーマ専用の地図のタブ (ThemeDashboardTabbed の地図・指標タブ・年度セレクタ) を撤去した。
 * 2026-06-20 から全テーマで隠していて (hideMap)、どのテーマでも表示されていなかった。
 * 2026-10-31: 47 都道府県を比べる地図・表・棒もテーマから外した。県の比較はランキングのページが受け持ち、テーマは
 * 1 つの県 (または全国) の値・推移・内訳・男女差を読む (オーナー決定)。数値タイルからランキングへ移れる。
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
