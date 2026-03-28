"use client";

import { useEffect, useMemo, useState } from "react";

import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { toBarChartRaceFrames, type RankingItem, type RankingValue } from "@stats47/ranking";
import { isOk } from "@stats47/types";
import { PlayCircle } from "lucide-react";



const BarChartRace = dynamic(
  () => import("@stats47/visualization/d3").then((m) => m.BarChartRace),
  { ssr: false },
);

import type { AreaType } from "@/features/area";

import { fetchAllYearsRankingValuesAction } from "../../actions/fetch-all-years-ranking-values";

import type { BarChartRaceFrame } from "@stats47/visualization/d3";

interface RankingBarChartRaceProps {
  rankingKey: string;
  areaType: AreaType;
  rankingValues: RankingValue[];
  rankingItem: RankingItem;
  unit: string;
  /** 都道府県コード（市区町村フィルタ用） */
  parentAreaCode?: string;
}

/**
 * ランキング Bar Chart Race コンポーネント
 *
 * プログレッシブデータ取得:
 * 1. 初期表示: 現在年1年分から1フレームの静止画を表示
 * 2. マウント後: 全年分データを非同期取得 → フルアニメーション可能に
 * 3. 単年データの場合は全年取得をスキップ
 */
export function RankingBarChartRace({
  rankingKey,
  areaType,
  rankingValues,
  rankingItem,
  unit,
  parentAreaCode,
}: RankingBarChartRaceProps) {
  const [allYearsFrames, setAllYearsFrames] = useState<BarChartRaceFrame[] | null>(null);
  const [isLoadingAllYears, setIsLoadingAllYears] = useState(false);

  // 現在年のデータから1フレーム生成（初期表示用）
  const initialFrames = useMemo(
    () => toBarChartRaceFrames(rankingValues),
    [rankingValues],
  );

  const hasMultipleYears = (rankingItem.availableYears?.length ?? 0) > 1;

  // マウント後に全年分データを非同期取得
  useEffect(() => {
    if (!hasMultipleYears) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync loading state for async fetch
    setIsLoadingAllYears(true);

    fetchAllYearsRankingValuesAction(rankingKey, areaType, parentAreaCode).then((result) => {
      if (cancelled) return;
      if (isOk(result)) {
        const frames = toBarChartRaceFrames(result.data);
        setAllYearsFrames(frames);
      }
      setIsLoadingAllYears(false);
    });

    return () => {
      cancelled = true;
    };
  }, [rankingKey, areaType, hasMultipleYears, parentAreaCode]);

  const frames = allYearsFrames ?? initialFrames;

  if (!rankingValues || rankingValues.length === 0) {
    return null;
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <PlayCircle className="h-4 w-4 text-muted-foreground" />
        <CardTitle>Bar Chart Race</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 min-h-0 flex flex-col">
        <BarChartRace
          data={frames}
          width={800}
          height={900}
          unit={unit}
          topN={20}
          isLoading={isLoadingAllYears}
          className="flex-1 min-h-0"
        />
      </CardContent>
    </Card>
  );
}
