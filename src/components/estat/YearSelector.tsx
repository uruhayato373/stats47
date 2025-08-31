'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface YearOption {
  code: string;
  year: number;
  displayName: string;
  count: number;
}

interface YearSelectorProps {
  years: YearOption[];
  currentYear?: string;
  className?: string;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  currentYear,
  className = ''
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (yearCode: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (yearCode) {
      params.set('year', yearCode);
    } else {
      params.delete('year');
    }
    
    router.push(`/choropleth?${params.toString()}`);
  };

  if (years.length === 0) {
    return null;
  }

  // 年度でソート（新しい順）
  const sortedYears = [...years].sort((a, b) => b.year - a.year);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label htmlFor="year-select" className="font-medium text-gray-900 whitespace-nowrap">
          表示年度:
        </label>
        <select
          id="year-select"
          value={currentYear || ''}
          onChange={(e) => handleYearChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
        >
          <option value="">すべての年度</option>
          {sortedYears.map((year) => (
            <option key={year.code} value={year.code}>
              {year.displayName} ({year.count}件)
            </option>
          ))}
        </select>
      </div>
      
      {currentYear && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            選択中: {sortedYears.find(y => y.code === currentYear)?.displayName || currentYear}
          </span>
          <button
            onClick={() => handleYearChange('')}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            すべての年度を表示
          </button>
        </div>
      )}
    </div>
  );
};