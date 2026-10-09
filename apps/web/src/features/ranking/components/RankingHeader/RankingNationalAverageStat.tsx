"use client";

import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { NumericTrendChart } from "@/components/charts/NumericTrendChart";
import { SurfaceCard } from "@/components/surface";

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

  return (
    <SurfaceCard className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div><p className="text-sm font-medium text-muted-foreground">{label}</p>{yearName && <p className="text-xs text-muted-foreground">{yearName}</p>}</div>
        <p className="whitespace-nowrap text-xl font-bold tabular-nums text-foreground">{formatRankingValue(figure.value, precision)}<span className="ml-1 text-sm font-medium">{formatUnitForDisplay(unit)}</span></p>
      </div>
      {hasTrend ? <NumericTrendChart points={series} policy={domainPolicy} selectedYear={yearName ? Number(yearName.slice(0, 4)) : undefined} label={label} unit={unit} formatValue={(value) => formatRankingValue(value, precision)} /> : <p className="mt-2 text-xs text-muted-foreground">{series.length === 1 ? "この指標は単年データです。" : "推移データはありません。"}</p>}
      {periodChange && <p className="text-xs text-muted-foreground">{periodChange.fromYear}→{periodChange.toYear} <span className="font-medium text-foreground">{periodChange.text}</span></p>}
    </SurfaceCard>
  );
}
