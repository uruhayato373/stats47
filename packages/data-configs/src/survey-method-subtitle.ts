/**
 * subtitle に調査方法の定型文が入っているかの判定。
 *
 * subtitle は同名の指標を区別する短い定義補足で、調査方法 (対象の都市・世帯・期間) は note が持つ
 * (正典: `.claude/rules/metric-config-standards.md`「フィールドの役割」)。
 * 家計調査の 825 件は「調査方法の書き出し + title」などを subtitle に入れていて、一覧の「title（subtitle）」が
 * 「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」になっていた (2026-11-14 に note へ移した)。
 * lint の subtitle-redundant は「subtitle が title を包含する」形を定義補足として通すので、この形は別に判定する。
 */

/** 家計調査の調査方法 (対象の都市・世帯・期間) を書いた subtitle の書き出し。出典の種類を問わず止める (825 件の形) */
const SURVEY_METHOD_SUBTITLE_PREFIX = "都道府県庁所在市の二人以上世帯の年間";

/**
 * 家計調査の取得レシピ (source.kind: kakei-chousa) の指標だけに掛ける、広い書き出し。
 * 「…の1世帯当たり年間」「…の消費支出に占める」「…の1世帯当たりの負債現在高」「家計調査（二人以上世帯）の調査世帯に占める」
 * の 25 件も調査方法を subtitle に書いていた (2026-11-24 に note へ移した)。
 * 家計調査から計算する external の指標 (エンゲル係数など) は、図の「県庁所在市」の表記を subtitle の文面で判定する読み手が
 * 残っているので、この広い書き出しの対象にしない。
 */
const KAKEI_SURVEY_METHOD_SUBTITLE_PREFIXES = ["都道府県庁所在市の二人以上世帯の", "家計調査（二人以上世帯）の調査世帯"];

/**
 * subtitle が調査方法の書き出しで始まるか。後ろに title や括弧書きが続いても、調査方法を subtitle に書いた形として数える。
 * @param opts.sourceKind 指標の source.kind。kakei-chousa なら広い書き出しも数える
 */
export function isSurveyMethodSubtitle(
  subtitle: string | null | undefined,
  opts: { sourceKind?: string } = {}
): boolean {
  const s = subtitle?.trim();
  if (!s) return false;
  if (s.startsWith(SURVEY_METHOD_SUBTITLE_PREFIX)) return true;
  return opts.sourceKind === "kakei-chousa" && KAKEI_SURVEY_METHOD_SUBTITLE_PREFIXES.some((prefix) => s.startsWith(prefix));
}
