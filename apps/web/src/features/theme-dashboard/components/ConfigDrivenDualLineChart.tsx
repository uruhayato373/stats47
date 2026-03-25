"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { isOk } from "@stats47/types";
import type { RankingValue } from "@stats47/ranking";

import { fetchAllYearsRankingValuesAction } from "@/features/ranking/actions/fetch-all-years-ranking-values";
import { computeNationalAverage } from "../lib/compute-national-average";
import type { ThemeChartDualLine } from "../types";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

interface Props {
  config: ThemeChartDualLine;
  prefCode: string;
  prefName: string;
}

/**
 * Config-driven 2系列ラインチャート
 *
 * ThemeChartDualLine の設定に従い、2指標の時系列データを取得・描画する。
 * 全国（00000）選択時は47都道府県の平均値を算出。
 */
export function ConfigDrivenDualLineChart({ config, prefCode, prefName }: Props) {
  const [chartData, setChartData] = useState<Record<string, string | number | undefined>[]>([]);
  const [isPending, startTransition] = useTransition();
  const isNational = prefCode === "00000";

  const [s0, s1] = config.series;

  useEffect(() => {
    setChartData([]);
    startTransition(async () => {
      const [result0, result1] = await Promise.all([
        fetchAllYearsRankingValuesAction(s0.rankingKey, "prefecture"),
        fetchAllYearsRankingValuesAction(s1.rankingKey, "prefecture"),
      ]);

      const all0 = isOk(result0) ? result0.data : [];
      const all1 = isOk(result1) ? result1.data : [];

      const map0 = isNational
        ? computeNationalAverage(all0)
        : toYearMap(all0.filter((v) => v.areaCode === prefCode));
      const map1 = isNational
        ? computeNationalAverage(all1)
        : toYearMap(all1.filter((v) => v.areaCode === prefCode));

      const allYears = [...new Set([...map0.keys(), ...map1.keys()])].sort();

      const merged = allYears.map((yearCode) => {
        const d0 = map0.get(yearCode);
        const d1 = map1.get(yearCode);
        return {
          category: yearCode,
          label: d0?.yearName ?? d1?.yearName ?? yearCode,
          [s0.name]: d0?.value,
          [s1.name]: d1?.value,
        };
      });

      setChartData(merged);
    });
  }, [prefCode, isNational, s0.rankingKey, s1.rankingKey]);

  if (isPending || chartData.length === 0) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (chartData.length <= 1) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        時系列データがありません
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
            { dataKey: s0.name, name: s0.name, color: s0.color },
            { dataKey: s1.name, name: s1.name, color: s1.color },
          ]}
          showLegend
          tooltipFormatter={(v) =>
            config.unit ? `${v.toLocaleString()} ${config.unit}` : v.toLocaleString()
          }
        />
      </div>
      {config.source && (
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          出典: {config.source}
        </p>
      )}
    </>
  );
}

function toYearMap(data: RankingValue[]) {
  const map = new Map<string, { value: number; yearName: string }>();
  for (const v of data) {
    map.set(v.yearCode, { value: v.value, yearName: v.yearName ?? v.yearCode });
  }
  return map;
}
