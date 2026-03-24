/**
 * 検索機能の型定義
 */

/**
 * コンテンツタイプ
 */
export type ContentType = "blog" | "ranking";

/**
 * MiniSearch インデックス用ドキュメント型
 * インデックス生成スクリプトと search-client で共通利用する
 */
export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  url: string;
  category?: string;
  categoryKey?: string;
  tags?: string[];
  subtitle?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
  latestYear?: string;
  publishedAt?: string;
  updatedAt?: string;
}

/**
 * 検索結果アイテム
 */
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  url: string;
  category?: string;
  tags?: string[];
  subtitle?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
  latestYear?: string;
  score?: number;
  publishedAt?: string;
  updatedAt?: string;
}

/**
 * 検索オプション
 */
export interface SearchOptions {
  type?: ContentType;
  category?: string;
  tags?: string[];
  year?: string;
  month?: string;
  limit?: number;
  offset?: number;
}

/**
 * 検索レスポンス
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  options?: SearchOptions;
}

/**
 * フィルタ用カテゴリメタ（search-index-meta.json の categories 要素）
 */
export interface SearchCategoryMeta {
  categoryKey: string;
  categoryName: string;
}

/**
 * フィルタ用タグメタ（search-index-meta.json の blogTags 要素）
 */
export interface SearchTagMeta {
  tag: string;
  count: number;
}

/**
 * 検索インデックスメタ（search-index-meta.json の型）
 */
export interface SearchIndexMeta {
  categories: SearchCategoryMeta[];
  blogTags: SearchTagMeta[];
  blogYears: string[];
}
