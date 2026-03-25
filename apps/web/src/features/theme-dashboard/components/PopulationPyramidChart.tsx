"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import {
  fetchPopulationPyramidAction,
  type PopulationPyramidResult,
} from "../actions/fetch-population-pyramid";

const PyramidChart = dynamic(
  () =>
    import("@stats47/visualization/d3").then((mod) => mod.PyramidChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
  },
);

interface Props {
  prefCode: string;
  prefName: string;
}

/**
 * 人口ピラミッドチャート（population-dynamics テーマ用）
 *
 * 選択都道府県の5歳階級別男女人口を取得し PyramidChart で描画。
 */
export function PopulationPyramidChart({ prefCode, prefName }: Props) {
  const [data, setData] = useState<PopulationPyramidResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setData(null);
    startTransition(async () => {
      const result = await fetchPopulationPyramidAction(prefCode);
      setData(result);
    });
  }, [prefCode]);

  if (isPending || !data) {
    return <Skeleton className="h-[300px] w-full rounded-md" />;
  }

  if (data.pyramidData.length === 0) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        人口ピラミッドデータがありません
      </div>
    );
  }

  return (
    <>
      <PyramidChart chartData={data.pyramidData} height={450} />
      <p className="text-[10px] text-muted-foreground mt-1 text-right">
        出典: 社会・人口統計体系
      </p>
    </>
  );
}
