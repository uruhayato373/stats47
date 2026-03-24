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
  出生率: number | undefined;
  死亡率: number | undefined;
}

/**
 * 出生率・死亡率の時系列ラインチャート（population-dynamics テーマ用）
 *
 * crude-birth-rate と crude-death-rate の全年度推移を2系列で表示。
 * 全国（00000）選択時は47都道府県の平均値を算出。
 */
export function BirthDeathRateLineChart({ prefCode, prefName }: Props) {
  const [chartData, setChartData] = useState<MergedDataPoint[]>([]);
  const [isPending, startTransition] = useTransition();
  const isNational = prefCode === "00000";

  useEffect(() => {
    setChartData([]);
    startTransition(async () => {
      const [birthResult, deathResult] = await Promise.all([
        fetchAllYearsRankingValuesAction("crude-birth-rate", "prefecture"),
        fetchAllYearsRankingValuesAction("crude-death-rate", "prefecture"),
      ]);

      const allBirth = isOk(birthResult) ? birthResult.data : [];
      const allDeath = isOk(deathResult) ? deathResult.data : [];

      const birthByYear = isNational
        ? computeNationalAverage(allBirth)
        : toYearMap(allBirth.filter((v) => v.areaCode === prefCode));
      const deathByYear = isNational
        ? computeNationalAverage(allDeath)
        : toYearMap(allDeath.filter((v) => v.areaCode === prefCode));

      const allYears = [
        ...new Set([...birthByYear.keys(), ...deathByYear.keys()]),
      ].sort();

      const merged: MergedDataPoint[] = allYears.map((yearCode) => {
        const birth = birthByYear.get(yearCode);
        const death = deathByYear.get(yearCode);
        return {
          category: yearCode,
          label: birth?.yearName ?? death?.yearName ?? yearCode,
          出生率: birth?.value,
          死亡率: death?.value,
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
        出生率・死亡率の推移データがありません
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
            { dataKey: "出生率", name: "出生率（人口千対）", color: "#3b82f6" },
            { dataKey: "死亡率", name: "死亡率（人口千対）", color: "#ef4444" },
          ]}
          showLegend
          tooltipFormatter={(v) => `${v.toFixed(1)}`}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {prefName}の粗出生率・粗死亡率の推移（人口千対） / 出典: 人口動態統計
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
