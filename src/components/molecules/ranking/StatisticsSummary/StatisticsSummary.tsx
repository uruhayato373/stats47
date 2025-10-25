"use client";

import React from "react";

import { RankingValue } from "@/lib/ranking/types";

export interface StatisticsSummaryProps {
  data: RankingValue[] | null;
  showStats?: {
    total?: boolean;
    average?: boolean;
    max?: boolean;
    min?: boolean;
  };
  className?: string;
}

interface SummaryData {
  total: number;
  average: number;
  max: number;
  min: number;
}

export const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({
  data,
  showStats = {
    total: false,
    average: true,
    max: true,
    min: true,
  },
  className = "",
}) => {
  const calculateSummary = (): SummaryData => {
    if (!data || data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const values = data
      .map((v) => v.value)
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

    if (values.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  };

  const summary = calculateSummary();
  const unit = data && data.length > 0 ? data[0].unit || "" : "";

  const cards = [
    {
      key: "total",
      label: "合計",
      value: summary.total,
      show: showStats.total,
    },
    {
      key: "average",
      label: "平均",
      value: summary.average,
      show: showStats.average,
    },
    {
      key: "max",
      label: "最大",
      value: summary.max,
      show: showStats.max,
    },
    {
      key: "min",
      label: "最小",
      value: summary.min,
      show: showStats.min,
    },
  ].filter((card) => card.show);

  // Tailwind CSS のグリッドクラスを動的に選択
  const gridColsClass =
    {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    }[cards.length] || "md:grid-cols-4";

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-4 ${className}`}>
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4"
        >
          <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">
            {card.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {card.key === "average"
                ? card.value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : card.value.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-neutral-500">
              {unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
