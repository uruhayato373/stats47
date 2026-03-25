"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { isOk } from "@stats47/types";
import type { RankingValue } from "@stats47/ranking";
import type { MixedChartDef } from "@stats47/types";

import { fetchAllYearsRankingValuesAction } from "@/features/ranking/actions/fetch-all-years-ranking-values";
import { computeNationalAverage } from "../lib/compute-national-average";

const D3MixedChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3MixedChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

interface Props {
  config: MixedChartDef;
  prefCode: string;
  prefName: string;
}

/**
 * Config-driven MixedChart（棒グラフ + 折れ線の2軸チャート）
 *
 * columns[0] を棒グラフ（左Y軸）、lines[0] を折れ線（右Y軸）で描画。
 */
export function ConfigDrivenMixedChart({ config, prefCode, prefName }: Props) {
  const [chartData, setChartData] = useState<Record<string, string | number | undefined>[]>([]);
  const [isPending, startTransition] = useTransition();
  const isNational = prefCode === "00000";

  const col = config.columns[0];
  const line = config.lines[0];

  useEffect(() => {
    setChartData([]);
    startTransition(async () => {
      const [resultCol, resultLine] = await Promise.all([
        fetchAllYearsRankingValuesAction(col.rankingKey, "prefecture"),
        fetchAllYearsRankingValuesAction(line.rankingKey, "prefecture"),
      ]);

      const allCol = isOk(resultCol) ? resultCol.data : [];
      const allLine = isOk(resultLine) ? resultLine.data : [];

      const mapCol = isNational
        ? computeNationalAverage(allCol)
        : toYearMap(allCol.filter((v) => v.areaCode === prefCode));
      const mapLine = isNational
        ? computeNationalAverage(allLine)
        : toYearMap(allLine.filter((v) => v.areaCode === prefCode));

      const allYears = [...new Set([...mapCol.keys(), ...mapLine.keys()])].sort();

      const merged = allYears.map((yearCode) => {
        const dCol = mapCol.get(yearCode);
        const dLine = mapLine.get(yearCode);
        return {
          category: yearCode,
          label: dCol?.yearName ?? dLine?.yearName ?? yearCode,
          [col.name]: dCol?.value,
          [line.name]: dLine?.value,
        };
      });

      setChartData(merged);
    });
  }, [prefCode, isNational, col.rankingKey, line.rankingKey]);

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
        <D3MixedChart
          data={chartData}
          categoryKey="category"
          columns={[{ dataKey: col.name, name: col.name, color: col.color }]}
          lines={[{ dataKey: line.name, name: line.name, color: line.color }]}
          leftUnit={config.leftUnit ?? ""}
          rightUnit={config.rightUnit ?? ""}
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
