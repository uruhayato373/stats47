"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import type { SunshineMapMeta } from "../lib/types";

const SunshineMapLeaflet = dynamic(
  () => import("./SunshineMapLeaflet").then((m) => m.SunshineMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[460px] lg:h-[600px] w-full rounded-md" />
    ),
  },
);

interface Props {
  meta: SunshineMapMeta | null;
}

/** 凡例グラデーション (青灰→黄→橙赤、export-sunshine-map-raster.ts の colorFor と対応) */
function LegendBar({ meta }: { meta: SunshineMapMeta }) {
  return (
    <div className="mt-2">
      <div
        className="h-3 w-full max-w-md rounded"
        style={{
          background:
            "linear-gradient(to right, rgb(70,90,130), rgb(250,210,90), rgb(220,90,40))",
        }}
      />
      <div className="flex justify-between max-w-md text-xs text-muted-foreground mt-0.5">
        <span>{meta.legend.lowHours}時間 以下</span>
        <span>{meta.legend.midHours}時間</span>
        <span>{meta.legend.highHours}時間 以上</span>
      </div>
    </div>
  );
}

export function SunshineMapClient({ meta }: Props) {
  if (!meta) {
    return (
      <p className="text-sm text-muted-foreground">
        地図データを読み込めませんでした。スナップショットの生成が必要です。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <SunshineMapLeaflet meta={meta} />
      <LegendBar meta={meta} />
      <p className="text-xs text-muted-foreground">
        年間日照時間（1km メッシュ）。色が暖色（橙）ほど日照が長く、寒色（青）ほど短い。
        全国 {meta.meshCount.toLocaleString()} メッシュ。最短{" "}
        {meta.valueRangeHours.min}時間 〜 最長 {meta.valueRangeHours.max}時間。
      </p>
    </div>
  );
}
