import { DashboardCard, LineChartClient, toLineChartData } from "@/features/stat-charts";
import { fetchEstatData, toKpiCardData } from "@/features/stat-charts/server";
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

  return (
    <DashboardCard
      title={title}
      description={description}
      source="社会・人口統計体系"
      sourceLink="https://www.e-stat.go.jp/"
    >
      <div className="flex flex-col gap-4">
        {/* 統計値（インライン描画） */}
        {displayValue != null && (
          <div>
            <p className="text-3xl font-bold tabular-nums">
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
    </DashboardCard>
  );
}
