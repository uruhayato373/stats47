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
  /** カテゴリキー（既存のcategoryテーブルと連携） */
  category: string;
  /** タグ配列 */
  tags: string[];
  /** 公開日 */
  date: string;
  /** 統計データID（ranking_itemsと連携） */
  statsDataId?: string;
  /** グラフ表示設定 */
  chartSettings?: {
    /** カラースキーム */
    colorScheme?: string;
    /** グラフタイプ */
    type?: "sequential" | "diverging" | "categorical";
    /** スケールに最小値を使用するか */
    useMinValueForScale?: boolean;
    /** 中央値のタイプ */
    centerType?: "zero" | "mean" | "median" | "value";
    /** 中央値（centerTypeが"value"の場合に使用） */
    centerValue?: number;
    /** 地域の値の計算方法 */
    regionValues?: "sum" | "average" | "mean";
  };
}

/**
 * 記事データ
 */
export interface Article {
  /** ファイル名から生成（例: total-population） */
  slug: string;
  /** 年度（例: 2023） */
  year?: string;
  /** 実際のディレクトリ名（カテゴリ） */
  actualCategory: string;
  /** Frontmatterメタデータ */
  frontmatter: ArticleFrontmatter;
  /** MDXコンテンツ */
  content: string;
  /** 抜粋（最初の160文字） */
  excerpt?: string;
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
  /** 年度 */
  year?: string;
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

