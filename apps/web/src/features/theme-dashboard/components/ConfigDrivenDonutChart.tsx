"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { fetchManufacturingCompositionAction, type ManufacturingCompositionItem } from "../actions/fetch-manufacturing-composition";
import type { ThemeChartDonutAction } from "../types";

const DonutChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.DonutChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

/** actionId → Server Action のマッピング */
const ACTION_MAP: Record<
  string,
  (prefCode: string) => Promise<ManufacturingCompositionItem[] | null>
> = {
  "manufacturing-composition": fetchManufacturingCompositionAction,
};

interface Props {
  config: ThemeChartDonutAction;
  prefCode: string;
  prefName: string;
}

/**
 * Config-driven ドーナツチャート
 *
 * ThemeChartDonutAction の設定に従い、Server Action でデータを取得・描画する。
 */
export function ConfigDrivenDonutChart({ config, prefCode, prefName }: Props) {
  const [data, setData] = useState<ManufacturingCompositionItem[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = ACTION_MAP[config.actionId];

  useEffect(() => {
    setData(null);
    if (!action) return;
    startTransition(async () => {
      const result = await action(prefCode);
      setData(result);
    });
  }, [prefCode, action]);

  if (!action) return null;

  if (isPending || data === null) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        産業構成データがありません
      </div>
    );
  }

  // 最大産業の割合を中央に表示
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const topItem = data[0];
  const topPct = total > 0 ? ((topItem.value / total) * 100).toFixed(1) : "0";

  return (
    <>
      <div className="h-[200px]">
        <DonutChart
          data={data.map((d) => ({ ...d }))}
          centerText={`${topPct}%`}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {data.slice(0, 5).map((d) => (
          <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
          </div>
        ))}
      </div>
      {config.source && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {prefName} / 出典: {config.source}
        </p>
      )}
    </>
  );
}
