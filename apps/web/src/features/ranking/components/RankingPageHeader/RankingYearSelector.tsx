"use client";

import { memo, useCallback, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

/** 年度情報の型 */
interface YearInfo {
  yearCode: string;
  yearName: string;
}

interface RankingYearSelectorProps {
  /** 年度情報配列 */
  times: YearInfo[];
  /** 現在選択中の年度コード */
  value: string;
  /** 変更時のコールバック */
  onChange: (yearCode: string) => void;
}

/**
 * ランキング年度選択コンポーネント（制御コンポーネント）
 * セレクトボックスで年度を選択できる
 */
function RankingYearSelectorComponent({
  times,
  value,
  onChange,
}: RankingYearSelectorProps) {
  // 年度を降順ソート（最新が先頭）
  const sortedTimes = useMemo(() => {
    return [...times].sort((a, b) => {
      const yearCodeA = parseInt(a.yearCode, 10);
      const yearCodeB = parseInt(b.yearCode, 10);
      return yearCodeB - yearCodeA;
    });
  }, [times]);

  // 年度選択時のハンドラー
  const handleYearChange = useCallback(
    (yearCode: string) => {
      onChange(yearCode);
    },
    [onChange]
  );

  // 年度が空の場合は何も表示しない
  if (times.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handleYearChange}>
        <SelectTrigger id="year-select" className="h-6 w-[100px] text-xs">
          <SelectValue placeholder="年度を選択" />
        </SelectTrigger>
        <SelectContent className="[&_*]:text-xs">
          {sortedTimes.map((year) => (
            <SelectItem key={year.yearCode} value={year.yearCode}>
              {year.yearName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * メモ化されたランキング年度選択コンポーネント
 * propsが変更されない場合は再レンダリングをスキップ
 */
export const RankingYearSelector = memo(RankingYearSelectorComponent);
