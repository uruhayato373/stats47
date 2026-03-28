"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const DivergingBarChart = dynamic(
  () => import("@stats47/visualization/d3/DivergingBarChart").then((mod) => mod.DivergingBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface LatestValues {
  label: string;
  positive: number;
  negative: number;
  positiveName: string;
  negativeName: string;
  unit: string;
  positiveRate?: number;
  negativeRate?: number;
  positiveRateLabel?: string;
  negativeRateLabel?: string;
}

interface DivergingBarChartClientProps {
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  positiveKey: string;
  negativeKey: string;
  positiveName: string;
  negativeName: string;
  positiveColor?: string;
  negativeColor?: string;
  unit?: string;
  yDomain?: [number, number];
  latestValues?: LatestValues;
}

export const DivergingBarChartClient: React.FC<DivergingBarChartClientProps> = ({
  data,
  categoryKey,
  positiveKey,
  negativeKey,
  positiveName,
  negativeName,
  positiveColor = "#3b82f6",
  negativeColor = "#ef4444",
  unit,
  yDomain,
  latestValues,
}) => {
  return (
    <div>
      {latestValues && (
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: positiveColor }} />
            <span className="text-sm text-muted-foreground">{latestValues.positiveName}</span>
            <span className="text-xl font-bold tabular-nums">{latestValues.positive.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{latestValues.unit}</span>
            {latestValues.positiveRate != null && (
              <span className="text-xs text-muted-foreground">({latestValues.positiveRateLabel ?? ""} {latestValues.positiveRate}%)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: negativeColor }} />
            <span className="text-sm text-muted-foreground">{latestValues.negativeName}</span>
            <span className="text-xl font-bold tabular-nums">{latestValues.negative.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{latestValues.unit}</span>
            {latestValues.negativeRate != null && (
              <span className="text-xs text-muted-foreground">({latestValues.negativeRateLabel ?? ""} {latestValues.negativeRate}%)</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">({latestValues.label})</span>
        </div>
      )}
      <DivergingBarChart
        data={data}
        categoryKey={categoryKey}
        positiveKey={positiveKey}
        negativeKey={negativeKey}
        positiveName={positiveName}
        negativeName={negativeName}
        positiveColor={positiveColor}
        negativeColor={negativeColor}
        unit={unit}
        yDomain={yDomain}
        height={350}
      />
    </div>
  );
};
