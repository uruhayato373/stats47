/**
 * ブログ記事の型定義
 */

/**
 * 記事のFrontmatterメタデータ
 */
export interface ArticleFrontmatter {
  /** 記事タイトル */
  title: string;
  /** 概要（SEO対策） - オプショナル */
  description?: string;
  /** タグ配列 */
  tags: string[];
}

/**
 * 記事データ
 */
export interface Article {
  /** ファイル名から生成（例: total-population） */
  slug: string;
  /** 時間（年度など、例: 2023） */
  time?: string;
  /** 実際のディレクトリ名（カテゴリ） */
  actualCategory: string;
  /** Frontmatterメタデータ */
  frontmatter: ArticleFrontmatter;
  /** MDXコンテンツ */
  content: string;
  /** 読了時間（分） */
  readingTime?: number;
}

/**
 * 記事一覧のフィルタ条件
 */
export interface ArticleFilter {
  /** カテゴリキー */
  category?: string;
  /** タグ配列 */
  tags?: string[];
  /** 時間（年度など） */
  time?: string;
  /** 取得件数 */
  limit?: number;
  /** オフセット */
  offset?: number;
}

/**
 * 記事一覧のソート順
 */
export type ArticleSortOrder = "date-desc" | "date-asc" | "title-asc";

/**
 * 記事一覧のレスポンス
 */
export interface ArticleListResponse {
  /** 記事配列 */
  articles: Article[];
  /** 総件数 */
  total: number;
  /** さらに記事があるか */
  hasMore: boolean;
}

/**
 * 記事のファイルパス情報
 */
export interface ArticleFilePath {
  /** カテゴリ（ディレクトリ名） */
  category: string;
  /** スラッグ（ディレクトリ名） */
  slug: string;
  /** 年度（ファイル名から抽出） */
  year: string;
  /** フルパス */
  fullPath: string;
}

