/**
 * Canonical URL生成ユーティリティ
 *
 * ページの正規URLを生成する関数を提供します。
 * SEO対策として、各ページのcanonical URLを統一フォーマットで管理します。
 */

/**
 * Canonical URL生成パラメータ
 */
export interface GenerateCanonicalUrlParams {
  /** カテゴリキー */
  category: string;
  /** 地域コード（オプション） */
  areaCode?: string;
  /** 追加セグメント配列（ranking, blogなど） */
  segments?: string[];
}

/**
 * Canonical URLを生成
 *
 * カテゴリ、地域コード、追加セグメントからcanonical URLを構築します。
 * 先頭の"/"は自動的に付与されます。
 *
 * @param params - Canonical URL生成パラメータ
 * @returns canonical URL文字列
 *
 * @example
 * ```typescript
 * // カテゴリページ: "/population"
 * generateCanonicalUrl({ category: "population" });
 *
 * // 地域別ダッシュボード: "/population/13000"
 * generateCanonicalUrl({
 *   category: "population",
 *   areaCode: "13000",
 * });
 *
 * // ランキングページ: "/population/ranking"
 * generateCanonicalUrl({
 *   category: "population",
 *   segments: ["ranking"],
 * });
 * ```
 */
export function generateCanonicalUrl({
  category,
  areaCode,
  segments = [],
}: GenerateCanonicalUrlParams): string {
  const parts: string[] = [category];

  if (areaCode) {
    parts.push(areaCode);
  }

  if (segments.length > 0) {
    parts.push(...segments);
  }

  return `/${parts.join("/")}`;
}
