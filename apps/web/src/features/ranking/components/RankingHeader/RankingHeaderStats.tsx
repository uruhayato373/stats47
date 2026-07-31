"use client";

import { useMemo } from "react";

import { cn } from "@stats47/components";

import type { AreaType } from "@/features/area";

import {
  computeRankingHeaderStats,
  resolveRankingPrecision,
} from "../../utils/compute-ranking-header-stats";

import { RankingNationalAverageStat } from "./RankingNationalAverageStat";
import { RankingTopThreeList } from "./RankingTopThreeList";

import type { NationalAveragePoint } from "../../lib/build-national-average-series";
import type { RankingValue } from "@stats47/ranking";

interface RankingHeaderStatsProps {
  rankingValues: RankingValue[];
  unit: string;
  nationalAverageSeries: NationalAveragePoint[];
  areaType: AreaType;
  yearName?: string | null;
  className?: string;
}

/**
 * ヘッダー直下の統計ブロック (上位3県+最下位 / 全国平均+推移)。
 *
 * 右レールの有無で本文カラム幅が変わるため、ビューポートではなくコンテナクエリで
 * 2 カラム化する (.claude/rules/ui-components.md)。
 */
export function RankingHeaderStats({
  rankingValues,
  unit,
  nationalAverageSeries,
  areaType,
  yearName,
  className,
}: RankingHeaderStatsProps) {
  const stats = useMemo(
    () => computeRankingHeaderStats(rankingValues),
    [rankingValues],
  );

  // 桁数は 47 県の観測値から 1 度だけ決め、表・ヘッダー・平均で同じ値を使う。
  // ここを揃えないと 60.42 が表では「60.42」ヘッダーでは「60.4」になる (旧実装の実バグ)
  const precision = useMemo(
    () =>
      resolveRankingPrecision(
        rankingValues.map((v) => v.value).filter((v): v is number => v !== null),
      ),
    [rankingValues],
  );

  if (stats.count === 0) return null;

  // 市区町村モードでは「全国平均」を出さない。1,700 超の市区町村の単純平均は
  // 都道府県平均とも全国値とも別の量で、同じラベルで見せると誤読になる。
  const showNationalAverage = areaType === "prefecture";

  return (
    <div className={cn("@container", className)}>
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showNationalAverage && "@md:grid-cols-2",
        )}
      >
        <RankingTopThreeList stats={stats} unit={unit} />
        {showNationalAverage && (
          <RankingNationalAverageStat
            average={stats.average}
            unit={unit}
            series={nationalAverageSeries}
            yearName={yearName}
            precision={precision}
          />
        )}
      </div>
    </div>
  );
}
