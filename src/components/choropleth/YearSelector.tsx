"use client";

import React from 'react';
import { useAtom } from 'jotai';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  selectedYearAtom,
  setYearAtom,
  availableYearsAtom,
  selectedSubcategoryDataAtom
} from '@/atoms/choropleth';
import { useStyles } from '@/hooks/useStyles';

interface YearSelectorProps {
  className?: string;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  className = ""
}) => {
  const styles = useStyles();
  const [selectedYear] = useAtom(selectedYearAtom);
  const [availableYears] = useAtom(availableYearsAtom);
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);
  const [, setYear] = useAtom(setYearAtom);

  if (!selectedSubcategory || availableYears.length === 0) {
    return null;
  }

  const handleYearChange = (year: string) => {
    setYear(year);
  };

  return (
    <div className={`${styles.card.base} ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className={styles.heading.sm}>対象年度</h3>
        </div>

        <div className="space-y-2">
          {/* 選択された年度を表示 */}
          <div className="text-sm text-gray-600 dark:text-neutral-400">
            {selectedYear ? (
              <span>選択中: <span className="font-medium text-gray-900 dark:text-neutral-100">{selectedYear}年</span></span>
            ) : (
              <span>年度を選択してください</span>
            )}
          </div>

          {/* 年度選択ボタン群 */}
          <div className="grid grid-cols-3 gap-2">
            {availableYears.map((year) => {
              const isSelected = selectedYear === year;

              return (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                    }
                  `}
                >
                  {year}
                </button>
              );
            })}
          </div>

          {/* ドロップダウン形式の年度選択（多数の年度がある場合用） */}
          {availableYears.length > 9 && (
            <div className="mt-3">
              <div className="relative">
                <select
                  value={selectedYear || ''}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={`
                    ${styles.input.base}
                    w-full pr-10 appearance-none cursor-pointer
                  `}
                >
                  <option value="">年度を選択</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* 統計表情報 */}
        {selectedSubcategory && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="text-xs text-gray-600 dark:text-neutral-400 space-y-1">
              <div>
                <span className="font-medium">統計表:</span>
                <span className="ml-1">{selectedSubcategory.tableName}</span>
              </div>
              {selectedSubcategory.lastUpdated && (
                <div>
                  <span className="font-medium">最終更新:</span>
                  <span className="ml-1">{selectedSubcategory.lastUpdated}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};