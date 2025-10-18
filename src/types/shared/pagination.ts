/**
 * ページネーション関連の型定義
 */

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  /** ページ番号（1始まり） */
  page: number;

  /** 1ページあたりのアイテム数 */
  pageSize: number;

  /** ソートキー */
  sortBy?: string;

  /** ソート順序 */
  sortOrder?: "asc" | "desc";
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  /** 現在のページ番号 */
  currentPage: number;

  /** 総ページ数 */
  totalPages: number;

  /** アイテムの総数 */
  totalItems: number;

  /** 1ページあたりのアイテム数 */
  itemsPerPage: number;

  /** 前のページがあるかどうか */
  hasPrevious: boolean;

  /** 次のページがあるかどうか */
  hasNext: boolean;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<TItem> {
  /** アイテムの配列 */
  items: TItem[];

  /** ページネーション情報 */
  pagination: PaginationInfo;
}
