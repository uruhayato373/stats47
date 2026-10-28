"use client";

import { memo, useMemo } from "react";

import { LazySelect } from "@stats47/components/molecules/lazy-select";

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
 * セレクトボックスで年度を選択できる (地図・表カードの見出し行の右に置く)
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

  const items = useMemo(
    () => sortedTimes.map((year) => ({ value: year.yearCode, label: year.yearName })),
    [sortedTimes]
  );

  // 年度が空の場合は何も表示しない
  if (times.length === 0) {
    return null;
  }

  // Select の JS は初回操作で読む (配信サイズ策 D・LazySelect)
  return (
    <LazySelect
      value={value}
      items={items}
      onValueChange={onChange}
      placeholder="年度を選択"
      aria-label="表示する年度"
      triggerClassName="h-6 w-[100px] text-xs rounded-xs"
      contentClassName="**:text-xs"
    />
  );
}

/**
 * メモ化されたランキング年度選択コンポーネント
 * propsが変更されない場合は再レンダリングをスキップ
 */
export const RankingYearSelector = memo(RankingYearSelectorComponent);
