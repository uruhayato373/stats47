/**
 * subtitle に調査方法の定型文が入っているかの判定。
 *
 * subtitle は同名の指標を区別する短い定義補足で、調査方法 (対象の都市・世帯・期間) は note が持つ
 * (正典: `.claude/rules/metric-config-standards.md`「フィールドの役割」)。
 * 家計調査の 825 件は「調査方法の書き出し + title」などを subtitle に入れていて、一覧の「title（subtitle）」が
 * 「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」になっていた (2026-11-14 に note へ移した)。
 * lint の subtitle-redundant は「subtitle が title を包含する」形を定義補足として通すので、この形は別に判定する。
 */

/** 家計調査の調査方法 (対象の都市・世帯・期間) を書いた subtitle の書き出し */
export const SURVEY_METHOD_SUBTITLE_PREFIX = "都道府県庁所在市の二人以上世帯の年間";

/** subtitle が調査方法の書き出しで始まるか。後ろに title や括弧書きが続いても、調査方法を subtitle に書いた形として数える。 */
export function isSurveyMethodSubtitle(subtitle: string | null | undefined): boolean {
  return Boolean(subtitle?.trim().startsWith(SURVEY_METHOD_SUBTITLE_PREFIX));
}
