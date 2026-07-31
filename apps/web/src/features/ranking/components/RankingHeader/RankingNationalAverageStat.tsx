"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { ChartEmptyState } from "@/components/charts/ChartState";
import { MiniLineChart } from "@/components/charts/MiniCharts";

import {
  computeNationalAveragePeriodChange,
  type NationalAveragePoint,
} from "../../lib/build-national-average-series";
import { formatRankingValue } from "../../utils/compute-ranking-header-stats";

interface RankingNationalAverageStatProps {
  /** 選択年の全国平均 (client 側で rankingValues から算出済み) */
  average: number | null;
  unit: string;
  /** 選択中の計算方法に対応した全国平均の推移 */
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
 * 全国平均と、その推移。
 *
 * 大きい数値は「選択年」、線は「全期間」で意味が違うため、両方にラベルを付けて
 * 取り違えを防ぐ。R2 の ranking values に全国行 (00000) が無いため、全国平均は
 * 47 都道府県の単純平均である旨を明記する。
 */
export function RankingNationalAverageStat({
  average,
  unit,
  series,
  yearName,
  precision,
}: RankingNationalAverageStatProps) {
  if (average === null) return null;

  const hasTrend = series.length >= 2;
  const periodChange = computeNationalAveragePeriodChange(series, unit);

  return (
    <ChartCard
      label={yearName ? `全国平均 ${yearName}` : "全国平均"}
      value={`${formatRankingValue(average, precision)}${unit}`}
      chart={
        hasTrend ? (
          <MiniLineChart
            points={series.map((p) => ({ year: p.year, value: p.value }))}
            seriesName="全国平均"
            unit={unit}
            height={CHART_HEIGHT}
          />
        ) : (
          <ChartEmptyState message="推移データなし" height={CHART_HEIGHT} />
        )
      }
      footer={
        hasTrend ? (
          <span>
            47都道府県の単純平均
            {periodChange && (
              <>
                {" ・ "}
                {periodChange.fromYear}→{periodChange.toYear} {periodChange.text}
              </>
            )}
          </span>
        ) : (
          <span>47都道府県の単純平均</span>
        )
      }
    />
  );
}
