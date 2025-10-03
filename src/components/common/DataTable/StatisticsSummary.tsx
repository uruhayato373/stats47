"use client";

import React from 'react';
import { FormattedValue } from '@/lib/estat/types/formatted';

export interface StatisticsSummaryProps {
  data: FormattedValue[] | null;
  unit: string;
  showTotal?: boolean;
  showAverage?: boolean;
  showMax?: boolean;
  showMin?: boolean;
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
  unit,
  showTotal = true,
  showAverage = true,
  showMax = true,
  showMin = true,
  className = '',
}) => {
  const calculateSummary = (): SummaryData => {
    if (!data || data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const values = data
      .map((v) => v.numericValue)
      .filter((v): v is number => v !== null && !isNaN(v));

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

  const cards = [
    {
      key: 'total',
      label: '合計',
      value: summary.total,
      show: showTotal,
    },
    {
      key: 'average',
      label: '平均',
      value: summary.average,
      show: showAverage,
    },
    {
      key: 'max',
      label: '最大',
      value: summary.max,
      show: showMax,
    },
    {
      key: 'min',
      label: '最小',
      value: summary.min,
      show: showMin,
    },
  ].filter((card) => card.show);

  // Tailwind CSS のグリッドクラスを動的に選択
  const gridColsClass = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[cards.length] || 'md:grid-cols-4';

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
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {card.key === 'average'
              ? card.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : card.value.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
};
