import { ChartPanel } from "@stats47/components";
import { resolveAttribution } from "@stats47/data-configs";
import { buildEstatTableUrl } from "@stats47/data-configs/data-source";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { LineChartClient, toLineChartData } from "@/components/stat-charts";
import { fetchEstatData, toKpiCardData } from "@/components/stat-charts/server";
import { STAT_VALUE_CLASS } from "@/components/surface";

import type { StatsLineChartProps } from "../../types/ranking-page-card";

interface StatsLineChartCardProps {
  title: string;
  props: StatsLineChartProps;
}

/**
 * 統計値 + 折れ線チャートカード（Server Component）
 *
 * 上部に全国最新値、下部に時系列折れ線チャートを表示する。
 */
export async function StatsLineChartCard({
  title,
  props,
}: StatsLineChartCardProps) {
  const { statParams, unit, lineParams, labels, description } = props;

  // 1. 全国最新値を取得
  const statResult = await fetchEstatData("00000", statParams);
  const statData =
    "data" in statResult ? toKpiCardData(statResult.data) : null;

  // 2. 時系列データを取得（複数系列対応）
  const paramsList = Array.isArray(lineParams) ? lineParams : [lineParams];
  const rawDataList = await Promise.all(
    paramsList.map(async (p) => {
      const result = await fetchEstatData("00000", p);
      return "data" in result ? result.data : [];
    })
  );

  const chartData = toLineChartData(rawDataList, labels);

  // 表示用の単位（props 指定 > e-Stat データ > 空）
  const displayUnit = unit ?? statData?.unit ?? "";
  const displayYear = statData?.year ?? "";
  const displayValue = statData?.value;

  // 出典は statsDataId / cdCat01 から解決する (SSDS → 社会・人口統計体系 + 原典、一次統計 → その調査)。
  // 以前は全カードを「社会・人口統計体系」と固定していたため、SSDS 以外の表で出典名が誤っていた。
  const attribution = resolveAttribution(statParams.statsDataId, statParams.cdCat01);
  const isAttributionResolved =
    attribution.compilation !== null || attribution.originalSurveys.length > 0;

  return (
    <ChartPanel
      title={title}
      description={description}
      footer={
        <ChartFooter
          source={isAttributionResolved ? undefined : "e-Stat"}
          attribution={isAttributionResolved ? attribution : undefined}
          sourceLink={buildEstatTableUrl(statParams.statsDataId)}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {/* 統計値（インライン描画） */}
        {displayValue != null && (
          <div>
            <p className={STAT_VALUE_CLASS}>
              {displayValue.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground ml-1">
                {displayUnit}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {displayYear}（全国）
            </p>
          </div>
        )}

        {/* 折れ線チャート */}
        {chartData.data.length > 0 && <LineChartClient chartData={chartData} />}
      </div>
    </ChartPanel>
  );
}
