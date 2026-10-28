"use client";

import { cn } from "@stats47/components";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { TrendingUp } from "lucide-react";

import { ChartPanel } from "@/components/charts/ChartPanel";
import { NumericTrendChart } from "@/components/charts/NumericTrendChart";
import { STAT_UNIT_CLASS, STAT_VALUE_CLASS } from "@/components/surface";

import {
  computeNationalAveragePeriodChange,
  type NationalAveragePoint,
} from "../../lib/build-national-average-series";
import { formatRankingValue } from "../../utils/compute-ranking-header-stats";

import type { NationalFigure } from "@stats47/ranking";
import type { NumericDomainPolicy } from "@stats47/types";

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
  domainPolicy: NumericDomainPolicy;
}


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
  domainPolicy,
}: RankingNationalAverageStatProps) {
  if (figure === null) return null;
  const label = figure.label;

  const hasTrend = series.length >= 2;
  const periodChange = computeNationalAveragePeriodChange(series, unit);

  // 見出し行は題だけにして隣の「上位3件」と高さをそろえる。大きな数値と年は本文の先頭に置く。
  // 推移の図は本文の残りの高さいっぱいに伸ばし、カードの下に空白を残さない。
  return (
    <ChartPanel
      title={label}
      icon={<TrendingUp />}
      contentClassName="flex flex-1 flex-col gap-2"
    >
      <p className="flex items-baseline gap-2">
        <span className={cn(STAT_VALUE_CLASS, "whitespace-nowrap")}>
          {formatRankingValue(figure.value, precision)}
          <span className={STAT_UNIT_CLASS}>{formatUnitForDisplay(unit)}</span>
        </span>
        {yearName && <span className="text-xs text-muted-foreground">（{yearName}）</span>}
      </p>
      {hasTrend ? (
        <NumericTrendChart
          points={series}
          policy={domainPolicy}
          selectedYear={yearName ? Number(yearName.slice(0, 4)) : undefined}
          label={label}
          unit={unit}
          formatValue={(value) => formatRankingValue(value, precision)}
          fillHeight
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          {series.length === 1 ? "この指標は単年データです。" : "推移データはありません。"}
        </p>
      )}
      {periodChange && (
        <p className="text-xs text-muted-foreground">
          {periodChange.fromYear}→{periodChange.toYear}{" "}
          <span className="font-medium text-foreground">{periodChange.text}</span>
        </p>
      )}
    </ChartPanel>
  );
}
