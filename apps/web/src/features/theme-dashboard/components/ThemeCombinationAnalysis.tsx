"use client";

import { useMemo } from "react";

import {
  ThemeCorrelationScatter,
  deriveAutoScatterPairs,
} from "./ThemeCorrelationScatter";
import { ThemeRadarChart } from "./ThemeRadarChart";

import type { ThemeConfig, ThemeIndicatorData } from "../types";

interface Props {
  themeConfig: ThemeConfig;
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  selectedPrefectureCode: string | null;
}

/**
 * テーマページの「組み合わせ分析」セクション
 *
 * 単一指標の choropleth + 個別ランキングが /ranking/{key} で見られる中、
 * テーマページ独自の価値として **複数指標を組み合わせた分析** を提供:
 *
 *   1. レーダーチャート: 選択県 × テーマ内全指標の percentile プロフィール
 *   2. 相関散布図: 2 指標ペアの 47 県分布
 *   3. (Phase 3b) 構成比 pie: 内訳データ (歳入の地方税 vs 交付税 等)
 *
 * これらは「1 指標 × 47 県」では作れないため、テーマページの独自性になる。
 */
export function ThemeCombinationAnalysis({
  themeConfig,
  indicatorDataMap,
  selectedPrefectureCode,
}: Props) {
  // scatter ペアは auto-derive (将来 D1 theme_metrics.chart_config_json で上書き可能に)
  const scatterPairs = useMemo(
    () => deriveAutoScatterPairs(themeConfig.rankingKeys, indicatorDataMap, 3),
    [themeConfig.rankingKeys, indicatorDataMap],
  );

  return (
    <section className="space-y-3">
      <ThemeRadarChart
        rankingKeys={themeConfig.rankingKeys}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={selectedPrefectureCode}
      />
      <ThemeCorrelationScatter
        pairs={scatterPairs}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={selectedPrefectureCode}
      />
      {/* Phase 3b: ThemeCompositionPie ここに追加予定 (歳入歳出 / 業種別構成比 等) */}
    </section>
  );
}
