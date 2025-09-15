"use client";

import React from "react";
import { ChoroplethMap } from "@/components/estat/visualization";

interface ChoroplethDisplayProps {
  dataset: {
    title: string;
    statName: string;
    dataPoints: Array<{
      prefectureCode: string;
      prefectureName: string;
      value: number;
      displayValue: string;
      unit: string | null;
    }>;
    summary: {
      totalCount: number;
      validCount: number;
      min: number | null;
      max: number | null;
      average: number | null;
    };
  };
}

export default function ChoroplethDisplay({ dataset }: ChoroplethDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-neutral-800 overflow-hidden">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
          {dataset.title}
        </h2>

        {/* データサマリー */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-neutral-700 p-3 rounded">
            <div className="text-gray-600 dark:text-neutral-400">データ数</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              {dataset.summary.validCount}/{dataset.summary.totalCount}
            </div>
          </div>

          {dataset.summary.min !== null && (
            <div className="bg-gray-50 dark:bg-neutral-700 p-3 rounded">
              <div className="text-gray-600 dark:text-neutral-400">最小値</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {dataset.summary.min.toLocaleString()}
              </div>
            </div>
          )}

          {dataset.summary.max !== null && (
            <div className="bg-gray-50 dark:bg-neutral-700 p-3 rounded">
              <div className="text-gray-600 dark:text-neutral-400">最大値</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {dataset.summary.max.toLocaleString()}
              </div>
            </div>
          )}

          {dataset.summary.average !== null && (
            <div className="bg-gray-50 dark:bg-neutral-700 p-3 rounded">
              <div className="text-gray-600 dark:text-neutral-400">平均値</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {dataset.summary.average.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* コロプレス地図 */}
      <div className="w-full overflow-x-auto">
        <ChoroplethMap
          dataset={dataset}
          width={800}
          height={600}
          className="w-full max-w-full"
        />
      </div>
    </div>
  );
}