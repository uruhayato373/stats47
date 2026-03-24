"use client";

import dynamic from "next/dynamic";
import type { BarChartRaceFrame } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const D3BarChartRace = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3BarChartRace),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DEFAULT_ASPECT_RATIO = "16/9";

function parseAspectRatio(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split("/").map(Number);
  if (w && h) return { width: w * 100, height: h * 100 };
  return { width: 1600, height: 900 };
}

interface D3BarChartRaceClientProps {
  data: BarChartRaceFrame[];
  unit?: string;
  aspectRatio?: string;
}

export function D3BarChartRaceClient({ data, unit, aspectRatio }: D3BarChartRaceClientProps) {
  const { width, height } = parseAspectRatio(aspectRatio || DEFAULT_ASPECT_RATIO);

  return (
    <D3BarChartRace
      data={data}
      unit={unit}
      isLoading={false}
      width={width}
      height={height}
      topN={15}
    />
  );
}
