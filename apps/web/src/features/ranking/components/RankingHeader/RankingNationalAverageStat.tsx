"use client";

import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { ChartEmptyState } from "@/components/charts/ChartState";
import { MiniLineChart } from "@/components/charts/MiniCharts";
import { SurfaceCard } from "@/components/surface";

import {
  computeNationalAveragePeriodChange,
  type NationalAveragePoint,
} from "../../lib/build-national-average-series";
import { formatRankingValue } from "../../utils/compute-ranking-header-stats";

import type { NationalFigure } from "@stats47/ranking";

interface RankingNationalAverageStatProps {
  /** 選択年の全国の基準値 (resolveNationalFigure で解決済み) */
  figure: NationalFigure | null;
  unit: string;
  /** 選択中の計算方法に対応した全国の基準値の推移 */
  series: NationalAveragePoint[];
  /** 大きい数値がどの年のものか */
  yearName?: string | null;
  /**
   * 表示する小数桁。**47 県の観測値から親が 1 度だけ解決して渡す。**
   * 平均だけ別の桁数で出すと表と食い違うため、ここで独自に決めない。
   */
  precision: number;
}

const CHART_HEIGHT = 84;

/**
 * 全国の基準値と、その推移。
 *
 * 大きい数値は「選択年」、線は「全期間」で意味が違うため、両方にラベルを付けて
 * 取り違えを防ぐ。公表の全国値 (00000) があれば「全国値」(総数なら「全国計」)、
 * 無ければ「47都道府県の単純平均」と明記する (lib/resolve-national-figure.ts)。
 */
export function RankingNationalAverageStat({
  figure,
  unit,
  series,
  yearName,
  precision,
}: RankingNationalAverageStatProps) {
  if (figure === null) return null;
  const label = figure.label;

  const hasTrend = series.length >= 2;
  const periodChange = computeNationalAveragePeriodChange(series, unit);

  return (
    <SurfaceCard className="@container">
      <div className="@sm:grid @sm:grid-cols-[minmax(0,1fr)_260px] @sm:grid-rows-[auto_1fr] @sm:gap-x-4 @md:block">
        <div className="flex items-baseline justify-between gap-2 @sm:col-start-1 @sm:row-start-1">
          <span className="text-sm font-medium text-muted-foreground">
            {yearName ? `${label} ${yearName}` : label}
          </span>
          <span className="text-xl font-bold text-foreground">
            {formatRankingValue(figure.value, precision)}
            {formatUnitForDisplay(unit)}
          </span>
        </div>

        <div className="mt-1 @sm:col-start-2 @sm:row-span-2 @sm:row-start-1 @sm:mt-0 @sm:flex @sm:items-center @md:mt-1 @md:block">
          {hasTrend ? (
            <MiniLineChart
              points={series.map((p) => ({ year: p.year, value: p.value }))}
              seriesName={label}
              unit={unit}
              height={CHART_HEIGHT}
            />
          ) : (
            <ChartEmptyState message="推移データなし" height={CHART_HEIGHT} />
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground @sm:col-start-1 @sm:row-start-2 @sm:mt-0 @sm:self-end @sm:justify-start @md:mt-0.5 @md:justify-end">
          {hasTrend ? (
            <span>
              {label}
              {periodChange && (
                <>
                  {" ・ "}
                  {periodChange.fromYear}→{periodChange.toYear} {periodChange.text}
                </>
              )}
            </span>
          ) : (
            <span>{label}</span>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
