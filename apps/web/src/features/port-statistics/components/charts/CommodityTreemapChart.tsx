"use client";

import { useState, useEffect, useTransition, useMemo } from "react";

import dynamic from "next/dynamic";

const TreemapChart = dynamic(
  () => import("@stats47/visualization/d3/TreemapChart").then((m) => m.TreemapChart),
  { ssr: false },
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import {
  fetchCommodityDataAction,
  type HierarchyNode,
} from "../../actions/fetch-commodity-data";

const DIRECTIONS = [
  { value: "total", label: "合計" },
  { value: "export", label: "輸出" },
  { value: "import", label: "輸入" },
  { value: "coastalOut", label: "移出" },
  { value: "coastalIn", label: "移入" },
] as const;

interface Props {
  prefectureCode: string | null;
  prefectureName: string | null;
  year: string;
}

export function CommodityTreemapChart({
  prefectureCode,
  prefectureName,
  year,
}: Props) {
  const [direction, setDirection] = useState("total");
  const [hierarchy, setHierarchy] = useState<Record<string, HierarchyNode> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!prefectureCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset data when no prefecture selected
      setHierarchy(null);
      return;
    }
    const areaCode = `${prefectureCode}000`;
    startTransition(async () => {
      const result = await fetchCommodityDataAction(areaCode, year);
      setHierarchy(result.hierarchy);
    });
  }, [prefectureCode, year]);

  const chartData = useMemo(() => {
    if (!hierarchy || !hierarchy[direction]) return null;
    return hierarchy[direction];
  }, [hierarchy, direction]);

  if (!prefectureCode) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">
        港をクリックすると、その都道府県の品種別貨物構成を表示します
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {prefectureName} 品種別貨物構成
        </h3>
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger className="h-7 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-xs">
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {chartData ? (
        <TreemapChart
          data={chartData}
          height={320}
          isLoading={isPending}
          unit="トン"
        />
      ) : (
        <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground animate-pulse">
          データを読み込み中...
        </div>
      )}
    </div>
  );
}
