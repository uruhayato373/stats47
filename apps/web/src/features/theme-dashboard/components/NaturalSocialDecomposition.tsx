"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import type { ThemeIndicatorData } from "../types";

const HorizontalDivergingBarChart = dynamic(
  () =>
    import("@stats47/visualization/d3").then(
      (mod) => mod.HorizontalDivergingBarChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[120px] w-full rounded-md" />,
  },
);

interface Props {
  prefCode: string;
  indicatorDataMap: Record<string, ThemeIndicatorData>;
}

/**
 * 人口増減の要因分解チャート（population-dynamics テーマ用）
 *
 * 自然増減率と社会増減率を HorizontalDivergingBarChart で表示。
 * indicatorDataMap から直接データを取得するため Server Action 不要。
 */
export function NaturalSocialDecomposition({
  prefCode,
  indicatorDataMap,
}: Props) {
  const chartData = useMemo(() => {
    const naturalData = indicatorDataMap["natural-increase-rate"];
    const socialData = indicatorDataMap["social-increase-rate"];

    if (!naturalData || !socialData) return null;

    const naturalValue = naturalData.rankingValues.find(
      (v) => v.areaCode === prefCode,
    );
    const socialValue = socialData.rankingValues.find(
      (v) => v.areaCode === prefCode,
    );

    if (naturalValue == null && socialValue == null) return null;

    return [
      {
        label: "自然増減率",
        value: naturalValue?.value ?? 0,
      },
      {
        label: "社会増減率",
        value: socialValue?.value ?? 0,
      },
    ];
  }, [prefCode, indicatorDataMap]);

  if (!chartData) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        増減要因データがありません
      </div>
    );
  }

  return (
    <>
      <HorizontalDivergingBarChart
        data={chartData}
        baseline={0}
        unit="‰"
        height={120}
      />
      <p className="text-[10px] text-muted-foreground mt-1">
        正=人口増加 / 負=人口減少（人口千人あたり）
      </p>
    </>
  );
}
