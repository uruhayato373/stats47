"use client";

import React from "react";
import SummaryCard from "./SummaryCard";

interface DataSummaryProps {
  totalCount: number;
  validCount: number;
  min: number | null;
  max: number | null;
  average: number | null;
}

export default function EstatDataSummary({
  totalCount,
  validCount,
  min,
  max,
  average,
}: DataSummaryProps) {
  return (
    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <SummaryCard
        label="データ数"
        value={`${validCount}/${totalCount}`}
      />

      {min !== null && (
        <SummaryCard
          label="最小値"
          value={min}
          formatValue={(value) => Number(value).toLocaleString()}
        />
      )}

      {max !== null && (
        <SummaryCard
          label="最大値"
          value={max}
          formatValue={(value) => Number(value).toLocaleString()}
        />
      )}

      {average !== null && (
        <SummaryCard
          label="平均値"
          value={average}
          formatValue={(value) => Number(value).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })}
        />
      )}
    </div>
  );
}
