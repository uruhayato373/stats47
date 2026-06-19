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
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: positiveColor }} />
                <span className="text-xs text-muted-foreground">{latestValues.positiveName}</span>
              </div>
              <div className="tabular-nums">
                <span className="text-lg font-bold">{latestValues.positive.toLocaleString()}</span>
                <span className="text-xs font-normal text-muted-foreground ml-0.5">{latestValues.unit}</span>
              </div>
              {latestValues.positiveRate != null && (
                <span className="text-xs text-muted-foreground">{latestValues.positiveRateLabel ?? ""} {latestValues.positiveRate}%</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: negativeColor }} />
                <span className="text-xs text-muted-foreground">{latestValues.negativeName}</span>
              </div>
              <div className="tabular-nums">
                <span className="text-lg font-bold">{latestValues.negative.toLocaleString()}</span>
                <span className="text-xs font-normal text-muted-foreground ml-0.5">{latestValues.unit}</span>
              </div>
              {latestValues.negativeRate != null && (
                <span className="text-xs text-muted-foreground">{latestValues.negativeRateLabel ?? ""} {latestValues.negativeRate}%</span>
              )}
            </div>
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-muted-foreground">{latestValues.label}</span>
          </div>
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
