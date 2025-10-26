/**
 * プロジェクト全体で使用されるユーティリティ型
 */

/**
 * API レスポンスをラップする型
 *
 * @template TData - レスポンスデータの型
 *
 * @example
 * ```typescript
 * const response: ApiResponse<User[]> = {
 *   data: users,
 *   status: 200,
 *   message: 'Success',
 *   timestamp: new Date().toISOString(),
 * };
 * ```
 */
export interface ApiResponse<TData> {
  /** レスポンスデータ */
  data: TData;

  /** HTTP ステータスコード */
  status: number;

  /** レスポンスメッセージ */
  message: string;

  /** レスポンスのタイムスタンプ */
  timestamp: string;
}

/**
 * ページネーション情報を含む型
 *
 * @template TItem - アイテムの型
 *
 * @example
 * ```typescript
 * const result: Paginated<User> = {
 *   items: users,
 *   total: 100,
 *   page: 1,
 *   pageSize: 20,
 *   hasMore: true,
 * };
 * ```
 */
export interface Paginated<TItem> {
  /** アイテムの配列 */
  items: TItem[];

  /** アイテムの総数 */
  total: number;

  /** 現在のページ番号（1始まり） */
  page: number;

  /** 1ページあたりのアイテム数 */
  pageSize: number;

  /** 次のページがあるかどうか */
  hasMore: boolean;
}

/**
 * 読み込み状態を表す Union 型
 *
 * @template TData - データの型
 * @template TError - エラーの型
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<LoadingState<User>>({ status: 'idle' });
 *
 * // ローディング開始
 * setState({ status: 'loading' });
 *
 * // 成功
 * setState({ status: 'success', data: user });
 *
 * // エラー
 * setState({ status: 'error', error: new Error('Failed') });
 * ```
 */
export type LoadingState<TData, TError = Error> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; error: TError };

/**
 * 非同期操作の結果を表す型
 */
export type AsyncResult<TData, TError = Error> =
  | { success: true; data: TData }
  | { success: false; error: TError };
