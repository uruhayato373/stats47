/**
 * 年度選択UIコンポーネント（プレゼンテーショナル）
 */
interface YearSelectorProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  disabled?: boolean;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onYearChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="year-select"
        className="text-sm text-gray-600 dark:text-neutral-400"
      >
        年度:
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
      >
        {years.length === 0 && <option value="">年度を読み込み中...</option>}
        {years.map((yearCode) => (
          <option key={yearCode} value={yearCode}>
            {yearCode.substring(0, 4)}年
          </option>
        ))}
      </select>
    </div>
  );
};
