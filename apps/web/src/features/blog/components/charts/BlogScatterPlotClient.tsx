"use client";

import dynamic from "next/dynamic";
import type { ScatterplotDataNode, ScatterplotProps } from "@stats47/visualization";

const Scatterplot = dynamic<ScatterplotProps>(
  () => import("@stats47/visualization").then((mod) => mod.Scatterplot),
  { ssr: false }
);

interface BlogScatterPlotClientProps {
  data: ScatterplotDataNode[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  className?: string;
}

export function BlogScatterPlotClient({
  data,
  xLabel,
  yLabel,
  title,
  className,
}: BlogScatterPlotClientProps) {
  return (
    <Scatterplot
      data={data}
      xLabel={xLabel}
      yLabel={yLabel}
      title={title}
      className={className}
    />
  );
}
