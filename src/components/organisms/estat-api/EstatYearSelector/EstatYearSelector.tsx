"use client";

import { useMemo } from "react";
import { FormattedYear } from "@/lib/estat-api";
import { YearSelector } from "@/components/common";

/**
 * e-Stat API用の年度選択コンポーネント
 *
 * 機能:
 * - FormattedYear[] から年度文字列を抽出
 * - 汎用YearSelectorに委譲してUI表示
 *
 * 責任:
 * - e-Stat特有の年度抽出ロジック（timeName から4桁の年度を抽出）
 * - 年度の重複除去とソート（降順）
 */
interface EstatYearSelectorProps {
  /**
   * EstatStatsDataService.formatStatsData() から取得した年度データ
   */
  years: FormattedYear[];

  /**
   * 現在選択されている年度（4桁の文字列）
   */
  selectedYear: string;

  /**
   * 年度変更時のコールバック
   */
  onYearChange: (year: string) => void;

  /**
   * 表示形式（"year": "2020年", "fiscal": "2020年度"）
   * @default "fiscal"
   */
  displayFormat?: "year" | "fiscal";

  /**
   * 無効化フラグ
   * @default false
   */
  disabled?: boolean;
}

export const EstatYearSelector: React.FC<EstatYearSelectorProps> = ({
  years,
  selectedYear,
  onYearChange,
  displayFormat = "fiscal",
  disabled = false,
}) => {
  // FormattedYear[] から年度文字列配列を抽出
  // timeName から4桁の年度を抽出し、重複除去してソート
  const yearStrings = useMemo(() => {
    const extractedYears = years
      .map((year) => {
        // timeName から4桁の年度を抽出（例: "2020年度" → "2020"）
        const match = year.timeName.match(/(\d{4})/);
        return match ? match[1] : null;
      })
      .filter((year): year is string => year !== null);

    // 重複除去 + 降順ソート（新しい年度が先頭）
    return [...new Set(extractedYears)].sort(
      (a, b) => parseInt(b) - parseInt(a)
    );
  }, [years]);

  // 汎用YearSelectorに委譲
  return (
    <YearSelector
      years={yearStrings}
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      displayFormat={displayFormat}
      disabled={disabled}
    />
  );
};

export type { EstatYearSelectorProps };
