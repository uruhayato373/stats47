"use client";

/**
 * 年度選択UIコンポーネント（プレゼンテーショナル）
 *
 * 年度データの仕様:
 * - years: 4桁の年度を文字列配列で受け取る（例: ["2020", "2019", "2018"]）
 * - selectedYear: 現在選択されている年度の文字列（例: "2020"）
 * - onYearChange: 年度変更時のコールバック関数
 * - displayFormat: 表示形式（"year" | "fiscal"）を指定（デフォルト: "fiscal"）
 *
 * 表示形式:
 * - "year": 「2020年」のように表示
 * - "fiscal": 「2020年度」のように表示
 * - 内部では4桁の文字列として処理
 */
interface YearSelectorProps {
  years: string[]; // 4桁の年度文字列配列（例: ["2020", "2019", "2018"]）
  selectedYear: string; // 現在選択されている年度の文字列（例: "2020"）
  onYearChange: (year: string) => void; // 年度変更コールバック
  displayFormat?: "year" | "fiscal"; // 表示形式（デフォルト: "fiscal"）
  disabled?: boolean;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onYearChange,
  displayFormat = "fiscal",
  disabled = false,
}) => {
  // 表示用のラベルテキストを決定
  const labelText = displayFormat === "fiscal" ? "年度:" : "年:";

  // 年度の表示形式を決定
  const formatYearDisplay = (yearCode: string) => {
    return displayFormat === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
  };
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="year-select"
        className="text-sm text-gray-600 dark:text-neutral-400"
      >
        {labelText}
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
      >
        {years.length === 0 && (
          <option value="">
            {displayFormat === "fiscal"
              ? "年度を読み込み中..."
              : "年を読み込み中..."}
          </option>
        )}
        {years.map((yearCode) => (
          <option key={yearCode} value={yearCode}>
            {formatYearDisplay(yearCode)}
          </option>
        ))}
      </select>
    </div>
  );
};

export type { YearSelectorProps };
