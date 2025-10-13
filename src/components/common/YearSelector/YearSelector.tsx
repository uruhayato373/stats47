"use client";

import React, { useMemo } from "react";
import { FormattedYear } from "@/lib/estat/types/formatted";

interface YearOption {
  code: string;
  year: number;
  displayName: string;
}

interface YearSelectorProps {
  years: FormattedYear[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  className?: string;
}

export default function YearSelector({
  years,
  selectedYear,
  onYearChange,
  className = "",
}: YearSelectorProps) {
  const availableYears = useMemo(() => {
    return years
      .map((year) => ({
        code: year.timeCode,
        year: parseInt(year.timeCode),
        displayName: year.timeName,
      }))
      .sort((a, b) => b.year - a.year);
  }, [years]);

  if (availableYears.length <= 1) {
    return null;
  }

  return (
    <div
      className={`bg-gray-50 dark:bg-neutral-700 p-4 rounded border border-gray-200 dark:border-neutral-600 ${className}`}
    >
      <div className="flex items-center gap-4">
        <label
          htmlFor="year-select"
          className="font-medium text-gray-900 dark:text-neutral-100 whitespace-nowrap"
        >
          表示年度:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
        >
          {availableYears.map((year) => (
            <option key={year.code} value={year.code}>
              {year.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type { YearOption, YearSelectorProps };
