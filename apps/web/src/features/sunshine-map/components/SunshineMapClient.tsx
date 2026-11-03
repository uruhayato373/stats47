"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { ChartLegend } from "@/components/charts/ChartLegend";

import type { SunshineMapMeta } from "../lib/types";

const SunshineMapLeaflet = dynamic(
  () => import("./SunshineMapLeaflet").then((m) => m.SunshineMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[460px] lg:h-[600px] w-full" />
    ),
  },
);

interface Props {
  meta: SunshineMapMeta | null;
}

/** 凡例の色の段 (青灰→黄→橙赤)。export-sunshine-map-raster.ts の colorFor と同じ値にする */
const SUNSHINE_SCALE_COLORS = ["rgb(70,90,130)", "rgb(250,210,90)", "rgb(220,90,40)"];

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
      <ChartLegend
        className="mt-2"
        label="年間日照時間の凡例"
        scale={{
          colors: SUNSHINE_SCALE_COLORS,
          labels: [
            `${meta.legend.lowHours}時間 以下`,
            `${meta.legend.midHours}時間`,
            `${meta.legend.highHours}時間 以上`,
          ],
        }}
      />
      <p className="text-xs text-muted-foreground">
        年間日照時間（1km メッシュ）。色が暖色（橙）ほど日照が長く、寒色（青）ほど短い。
        全国 {meta.meshCount.toLocaleString()} メッシュ。最短{" "}
        {meta.valueRangeHours.min}時間 〜 最長 {meta.valueRangeHours.max}時間。
      </p>
    </div>
  );
}
