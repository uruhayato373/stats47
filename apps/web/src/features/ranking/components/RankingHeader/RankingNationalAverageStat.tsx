"use client";

import { cn, ChartPanel } from "@stats47/components";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { PREFECTURE_COUNT, simpleMeanLabel, type NationalFigure } from "@stats47/ranking";
import { TrendingUp } from "lucide-react";

import { getMetricChartColor } from "@/components/charts/ChartPalette";
import { NumericTrendChart } from "@/components/charts/NumericTrendChart";
import { STAT_UNIT_CLASS, STAT_VALUE_CLASS } from "@/components/surface";

import { formatRankingValue } from "../../utils/compute-ranking-header-stats";

import type { NationalAveragePoint } from "../../lib/build-national-average-series";
import type { MetricPresentation } from "@stats47/types";

interface RankingNationalAverageStatProps {
  /** ランキング表記などを除いた、表示中の指標名 */
  metricTitle: string;
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
  /** 表示単位への倍率 (ページが決めた表示単位があるとき)。値と推移は元の単位のまま受け取る */
  factor?: number;
  presentation: Pick<MetricPresentation, "colorScheme" | "trendDomain">;
}

/** 観測の数がこれ以下の折れ線は、縦軸に 0 を含める (2 点は傾きしか情報が無い) */
const MAX_POINTS_FOR_ZERO_BASELINE = 2;

/** 指標の推移。選択年の数値を並べ、年ごとの値は図の操作時に表示する。 */
export function RankingNationalAverageStat({
  metricTitle,
  figure,
  unit,
  series,
  yearName,
  precision,
  factor = 1,
  presentation,
}: RankingNationalAverageStatProps) {
  if (figure === null) return null;

  const hasTrend = series.length >= 2;
  const hasTotal = series.some((point) => point.total != null);
  const selectedYear = yearName ? Number(yearName.slice(0, 4)) : undefined;
  const selectedPoint = series.find((point) => point.year === selectedYear);
  const displayUnit = formatUnitForDisplay(unit);
  const meanLabel = (count: number) =>
    `${metricTitle}（${count === PREFECTURE_COUNT ? "" : count}都道府県平均）`;
  const totalLabel = `${metricTitle}（全国）`;
  const lineLabel = hasTotal || figure.kind === "simple-mean"
    ? meanLabel(selectedPoint?.count ?? figure.prefectureCount ?? PREFECTURE_COUNT)
    : totalLabel;
  const lineColor = getMetricChartColor(presentation);
  const linePoints = hasTotal
    ? series.map((point) => ({ year: point.year, value: point.mean ?? Number.NaN }))
    : series;
  // このカードは軸の文字を出さない。観測が 2 点だけの折れ線は傾きしか情報が無く、縦軸を値の範囲に切り詰めると
  // 27.1% → 27.4% の差が枠いっぱいの上昇に見える。2 点のときは 0 を含む縦軸にして、差を値との比で見せる。
  // 範囲が固定の指標 (fixed) は範囲そのものが意味を持つので変えない。
  const observedCount = linePoints.filter((point) => Number.isFinite(point.value)).length;
  const trendPolicy = observedCount <= MAX_POINTS_FOR_ZERO_BASELINE && presentation.trendDomain.mode === "extent"
    ? { ...presentation.trendDomain, mode: "zero" as const }
    : presentation.trendDomain;
  const areaSeries = hasTotal ? {
    label: totalLabel,
    points: series.map((point) => ({ year: point.year, value: point.total ?? Number.NaN })),
    color: lineColor,
    domainPolicy: { mode: "zero" } as const,
  } : undefined;
  const summaryValues = hasTotal ? [
    { label: "合計", value: selectedPoint?.total ?? null, description: "47都道府県の合計" },
    { label: "平均", value: selectedPoint?.mean ?? null, description: simpleMeanLabel(selectedPoint?.count ?? 0) },
  ] : [{
    label: figure.kind === "simple-mean" ? "平均" : figure.kind === "national-total" ? "合計" : "全国値",
    value: figure.value,
    description: figure.label,
  }];

  // 年は見出しの右、数値は横並び。幅や桁数が足りない場合は項目ごと折り返す。
  // 推移の図は本文の残りの高さいっぱいに伸ばし、カードの下に空白を残さない。
  return (
    <ChartPanel
      title={`${metricTitle}の推移`}
      icon={<TrendingUp />}
      action={yearName && <span className="whitespace-nowrap text-xs text-muted-foreground">{yearName}</span>}
      contentClassName="flex flex-1 flex-col gap-2"
    >
      <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {summaryValues.map((summary) => (
          <div key={summary.label} className="flex items-baseline whitespace-nowrap" title={summary.description}>
            <dt className="text-xs text-muted-foreground">{summary.label}：</dt>
            <dd className={cn(STAT_VALUE_CLASS, hasTotal && "text-base leading-6")}>
              {summary.value == null ? "—" : formatRankingValue(summary.value, precision, factor)}
              {summary.value != null && <span className={STAT_UNIT_CLASS}>{displayUnit}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {hasTrend ? (
        <NumericTrendChart
          points={linePoints}
          policy={trendPolicy}
          label={lineLabel}
          unit={displayUnit}
          formatValue={(value) => formatRankingValue(value, precision, factor)}
          fillHeight
          showAxes={false}
          areaSeries={areaSeries}
          lineColor={lineColor}
          formatYear={(year) => series.find((point) => point.year === year)?.yearName ?? `${year}年`}
          tooltipItems={(point) => {
            const observation = series.find((entry) => entry.year === point.year);
            return [
              ...(observation?.total != null
                ? [{ name: totalLabel, value: observation.total, color: lineColor }]
                : []),
              {
                name: observation && (hasTotal || observation.kind === "simple-mean")
                  ? meanLabel(observation.count) : totalLabel,
                value: point.value,
                color: lineColor,
              },
            ];
          }}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          {series.length === 1 ? "この指標は単年データです。" : "推移データはありません。"}
        </p>
      )}
    </ChartPanel>
  );
}
