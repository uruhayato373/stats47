"use client";

import { RankingBarList } from "@/components/charts/RankingBarList";
import { SurfaceCard } from "@/components/surface";

import type {
  RankingHeaderEntry,
  RankingHeaderStats,
} from "../../utils/compute-ranking-header-stats";

interface RankingTopThreeListProps {
  stats: RankingHeaderStats;
  unit: string;
}

function toBarItem(entry: RankingHeaderEntry, tone: "top" | "bottom") {
  return {
    key: entry.areaCode,
    label: entry.areaName,
    value: entry.value,
    rank: entry.rank,
    tone,
  };
}

/**
 * 上位 3 件と最下位を 1 枚にまとめたリスト。
 *
 * 上位と最下位で同じ max (1 位の値) を渡し、バー長を共通スケールにする。
 * これをしないと最下位のバーが常に全長になり、幅が広いほど値が大きいという
 * 読み方が崩れる。
 */
export function RankingTopThreeList({ stats, unit }: RankingTopThreeListProps) {
  const { top3, last } = stats;
  if (top3.length === 0) return null;

  const scaleMax = Math.max(...top3.map((e) => Math.abs(e.value)), 1);
  // 最下位が上位 3 件に含まれる (県数が極端に少ない指標) なら重複表示しない
  const showLast = last != null && !top3.some((e) => e.areaCode === last.areaCode);

  // 上位と最下位で同じ設定を使う (max を共有しないとバー長のスケールが揃わない)
  const listProps = {
    max: scaleMax,
    unit,
    showRank: true,
    valueMaximumFractionDigits: 1,
    labelClassName: "w-20",
    // 既定の w-20 だと総人口のような桁数で単位が折り返すため内容幅に任せる
    valueClassName: "w-auto whitespace-nowrap",
  } as const;

  return (
    <SurfaceCard className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          上位3県{showLast ? "と最下位" : ""}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">単位: {unit}</span>
        )}
      </div>
      <RankingBarList items={top3.map((e) => toBarItem(e, "top"))} {...listProps} />
      {showLast && (
        <>
          <div className="border-t border-border" />
          <RankingBarList items={[toBarItem(last, "bottom")]} {...listProps} />
        </>
      )}
    </SurfaceCard>
  );
}
