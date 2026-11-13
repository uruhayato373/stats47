"use client";

import { ChartPanel } from "@stats47/components";
import { buildEstatTableUrl } from "@stats47/data-configs/data-source";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { PanelGrid } from "@/components/layout/PageShell";

import { useThemePrefecture } from "../ThemePrefectureContext";

import { KakeiAxisChart } from "./KakeiAxisChart";

import type { KakeiAxisChart as KakeiAxisChartData } from "@stats47/stats-r2/types";

const KAKEI_PERIOD_LABELS: Record<KakeiAxisChartData["period"], string> = {
  "monthly-average": "1か月平均",
  "annual-total": "年間合計",
  balance: "残高",
  "month-total": "月ごとの合計",
};

/**
 * 家計調査の分類軸 (年間収入・世帯人数・世帯類型・住居の所有関係・月など) ごとの全国の値。
 * 全国の値なので、県を選んでいるとき (県のページ) は描かない (テーマ・地域のページは 1 つの地域を見せる。theme-catalog-standards §3.0)
 */
export function KakeiAxisSectionClient({ charts }: { charts: KakeiAxisChartData[] }) {
  const { selectedPrefectureCode } = useThemePrefecture();
  if (selectedPrefectureCode || charts.length === 0) return null;
  return (
    <PanelGrid className="grid-cols-1 @md:grid-cols-2">
      {charts.map((chart) => (
        <ChartPanel
          key={chart.id}
          title={chart.title}
          description={chart.description}
          footer={
            <ChartFooter
              source={`e-Stat 家計調査 ${(chart.sourceIds ?? [chart.sourceId]).join("・")}（2025年）`}
              sourceLink={buildEstatTableUrl(chart.sourceId)}
              sourceLinks={chart.sourceIds?.map((sourceId) => ({ label: `e-Stat 統計表 ${sourceId}`, url: buildEstatTableUrl(sourceId) }))}
              annotation={`${chart.household}・${chart.axis}・${KAKEI_PERIOD_LABELS[chart.period]}・${chart.unit}`}
            />
          }
        >
          <KakeiAxisChart chart={chart} />
        </ChartPanel>
      ))}
    </PanelGrid>
  );
}
