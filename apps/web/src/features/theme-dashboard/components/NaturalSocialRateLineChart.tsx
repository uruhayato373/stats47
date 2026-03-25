"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { isOk } from "@stats47/types";
import type { RankingValue } from "@stats47/ranking";

import { fetchAllYearsRankingValuesAction } from "@/features/ranking/actions/fetch-all-years-ranking-values";
import { computeNationalAverage } from "../lib/compute-national-average";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-md" />,
  },
);

interface Props {
  prefCode: string;
  prefName: string;
}

interface MergedDataPoint {
  [key: string]: string | number | undefined;
  category: string;
  label: string;
  自然増減率: number | undefined;
  社会増減率: number | undefined;
}

/**
 * 自然増減率・社会増減率の時系列ラインチャート（population-dynamics テーマ用）
 *
 * natural-increase-rate と social-increase-rate の全年度推移を2系列で表示。
 * 全国（00000）選択時は47都道府県の平均値を算出。
 */
export function NaturalSocialRateLineChart({ prefCode, prefName }: Props) {
  const [chartData, setChartData] = useState<MergedDataPoint[]>([]);
  const [isPending, startTransition] = useTransition();
  const isNational = prefCode === "00000";

  useEffect(() => {
    setChartData([]);
    startTransition(async () => {
      const [naturalResult, socialResult] = await Promise.all([
        fetchAllYearsRankingValuesAction("natural-increase-rate", "prefecture"),
        fetchAllYearsRankingValuesAction("social-increase-rate", "prefecture"),
      ]);

      const allNatural = isOk(naturalResult) ? naturalResult.data : [];
      const allSocial = isOk(socialResult) ? socialResult.data : [];

      const naturalByYear = isNational
        ? computeNationalAverage(allNatural)
        : toYearMap(allNatural.filter((v) => v.areaCode === prefCode));
      const socialByYear = isNational
        ? computeNationalAverage(allSocial)
        : toYearMap(allSocial.filter((v) => v.areaCode === prefCode));

      const allYears = [
        ...new Set([...naturalByYear.keys(), ...socialByYear.keys()]),
      ].sort();

      const merged: MergedDataPoint[] = allYears.map((yearCode) => {
        const natural = naturalByYear.get(yearCode);
        const social = socialByYear.get(yearCode);
        return {
          category: yearCode,
          label: natural?.yearName ?? social?.yearName ?? yearCode,
          自然増減率: natural?.value,
          社会増減率: social?.value,
        };
      });

      setChartData(merged);
    });
  }, [prefCode, isNational]);

  if (isPending || chartData.length === 0) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (chartData.length <= 1) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        自然増減率・社会増減率の推移データがありません
      </div>
    );
  }

  return (
    <>
      <div className="h-[200px]">
        <D3LineChart
          data={chartData}
          categoryKey="category"
          series={[
            { dataKey: "自然増減率", name: "自然増減率（人口千対）", color: "#22c55e" },
            { dataKey: "社会増減率", name: "社会増減率（人口千対）", color: "#a855f7" },
          ]}
          showLegend
          tooltipFormatter={(v) => `${v.toFixed(2)}‰`}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-right">
        出典: 人口動態統計・住民基本台帳
      </p>
    </>
  );
}

/** 単一都道府県のデータを yearCode → {value, yearName} の Map に変換 */
function toYearMap(data: RankingValue[]) {
  const map = new Map<string, { value: number; yearName: string }>();
  for (const v of data) {
    map.set(v.yearCode, { value: v.value, yearName: v.yearName ?? v.yearCode });
  }
  return map;
}
