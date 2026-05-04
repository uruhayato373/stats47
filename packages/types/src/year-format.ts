export type YearFormat = "fiscal" | "calendar" | "plain";

/**
 * yearCode と year_format から yearName を生成する
 *
 * - fiscal:   "2024" → "2024年度"
 * - calendar: "2024" → "2024年"
 * - plain:    "2024" → "2024"
 */
export function formatYearName(yearCode: string, format: YearFormat): string {
  const year = yearCode.slice(0, 4);
  switch (format) {
    case "fiscal":
      return `${year}年度`;
    case "calendar":
      return `${year}年`;
    case "plain":
      return year;
  }
}
