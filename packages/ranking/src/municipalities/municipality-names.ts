/**
 * 市区町村の表示名。市区町村ランキング・市区町村ページ・title が同じ規則で名前を書くための唯一の置き場。
 * 配信値の areaName は「愛知県 豊田市」のように県名と空白を含む (市区町村マスタの形)。
 */

/** 「愛知県 豊田市」→「豊田市」。 */
export function municipalityLeafName(areaName: string): string {
  const parts = areaName.trim().split(/\s+/);
  return parts[parts.length - 1] || areaName;
}

/** 「愛知県 豊田市」→「愛知県豊田市」(title や説明文で県を添えて書くとき)。 */
export function municipalityFullName(areaName: string): string {
  return areaName.trim().split(/\s+/).join('');
}

/** 「東京都」→「都内」、「北海道」→「道内」、「大阪府」→「府内」、「香川県」→「県内」(順位の範囲を書くとき)。 */
export function prefectureInsideLabel(prefectureName: string): string {
  return `${prefectureName.trim().slice(-1)}内`;
}

/**
 * 一覧で使う名前。同じ名前の自治体が複数ある (府中市・伊達市など) ときだけ「府中市（東京都）」と県を添える。
 * 県を常に付けると一覧が読みにくくなり、付けないと同名の自治体を区別できない (MUNI-PAGE-QUALITY-01)。
 */
export function buildMunicipalityListNames(
  areaNames: readonly string[]
): (areaName: string) => string {
  const counts = new Map<string, number>();
  for (const name of areaNames) {
    const leaf = municipalityLeafName(name);
    counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
  }
  return (areaName) => {
    const leaf = municipalityLeafName(areaName);
    if ((counts.get(leaf) ?? 0) <= 1) return leaf;
    const prefecture = areaName.trim().split(/\s+/)[0];
    return prefecture && prefecture !== leaf ? `${leaf}（${prefecture}）` : leaf;
  };
}

/**
 * 市区町村ランキングの表示名。同名 title の指標 (事業所数×業種など) は生成器が subtitle を焼き込むので、
 * それを併記する (併記しないと同じ <title> のページが複数できる)。
 */
export function municipalityRankingDisplayTitle(item: {
  title: string;
  subtitle?: string | null;
}): string {
  return item.subtitle ? `${item.title}（${item.subtitle}）` : item.title;
}
