/** 年次更新後に旧年の順位・値を説明する考察を表示しない。 */
export function selectCurrentAiContent<T extends { yearCode: string }>(
  content: T | null,
  selectedYear: string,
): T | null {
  if (!content || !selectedYear) return null;
  return String(content.yearCode).slice(0, 4) === String(selectedYear).slice(0, 4)
    ? content
    : null;
}
