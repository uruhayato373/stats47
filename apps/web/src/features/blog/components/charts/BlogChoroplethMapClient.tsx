"use client";

import dynamic from "next/dynamic";

import type { PrefectureMapProps } from "@stats47/visualization/d3";

const PrefectureMapChart = dynamic<PrefectureMapProps>(
  () => import("@stats47/visualization/d3/PrefectureMapChart").then((mod) => mod.PrefectureMapChart),
  { ssr: false }
);

interface BlogChoroplethMapClientProps {
  data: { areaCode: string; value: number }[];
  unit?: string;
  colorScheme?: string;
  className?: string;
}

export function BlogChoroplethMapClient({
  data,
  unit,
  colorScheme,
  className,
}: BlogChoroplethMapClientProps) {
  return (
    <PrefectureMapChart
      data={data}
      colorConfig={{
        colorSchemeType: "sequential" as const,
        ...(colorScheme && { colorScheme }),
      }}
      unit={unit}
      className={className}
    />
  );
}
