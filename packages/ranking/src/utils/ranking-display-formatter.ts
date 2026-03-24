/**
 * ランキング表示情報の型定義
 */
export interface RankingDisplayContext {
  /** 年度表示名 (例: "2023年度") */
  yearName: string;
  /** 都道府県別・ランキング・年度パターンを除去した短縮タイトル */
  title: string;
  /** サブタイトル (例: "総人口1人あたり") */
  subtitle: string;
  /** demographicAttr + normalizationBasis を「・」で結合 */
  attributes: string;
  /** 小数点以下の表示桁数 */
  decimalPlaces: number;
  /** 単位 */
  unit: string;
}

/**
 * ランキング表示情報の型定義（拡張版）
 */
export interface RankingDisplayInfo extends RankingDisplayContext {
  /** 対象属性 */
  demographicAttr: string | null;
  /** 正規化の基準 */
  normalizationBasis: string | null;
  /** 注釈 */
  annotation: string | null;
  /** 定義の詳細説明 */
  description: string | null;
}

/**
 * ランキング情報を整理されたコンテキストとして構築
 * プロジェクト全体で統一的なタイトル表示を行うための基盤関数
 *
 * @param item - ランキング情報
 * @returns 整理された表示用コンテキスト
 */
export function buildRankingDisplayContext(item: {
  title: string;
  subtitle?: string | null;
  demographicAttr?: string | null;
  normalizationBasis?: string | null;
  latestYear?: { yearCode: string; yearName: string } | null;
  unit: string;
  valueDisplay?: { decimalPlaces?: number } | null;
}): RankingDisplayContext {
  const yearName = item.latestYear?.yearName || "";

  const title = item.title
    .replace(/（\d{4}年度?）/, "")
    .replace(/^都道府県別\s*/, "")
    .replace(/\s*ランキング$/, "")
    .trim();

  const subtitle = item.subtitle || "";

  const attrParts: string[] = [];
  if (item.demographicAttr) attrParts.push(item.demographicAttr);
  if (item.normalizationBasis) attrParts.push(item.normalizationBasis);
  const attributes = attrParts.join("・");

  const decimalPlaces = item.valueDisplay?.decimalPlaces ?? 0;
  const unit = item.unit;

  return { yearName, title, subtitle, attributes, decimalPlaces, unit };
}

/**
 * ランキング表示情報を構築（demographicAttr・normalizationBasis・annotation 付き）
 *
 * @param item - ランキング情報
 * @returns 表示用の拡張情報
 */
export function buildRankingDisplayInfo(item: {
  title: string;
  subtitle?: string | null;
  demographicAttr?: string | null;
  normalizationBasis?: string | null;
  annotation?: string | null;
  description?: string | null;
  latestYear?: { yearCode: string; yearName: string } | null;
  unit: string;
  valueDisplay?: { decimalPlaces?: number } | null;
}): RankingDisplayInfo {
  const context = buildRankingDisplayContext(item);
  return {
    ...context,
    demographicAttr: item.demographicAttr ?? null,
    normalizationBasis: item.normalizationBasis ?? null,
    annotation: item.annotation ?? null,
    description: item.description ?? null,
  };
}
