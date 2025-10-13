/**
 * useSWR用の統一fetcher関数
 *
 * 処理フロー:
 * 1. fetch APIでHTTPリクエスト実行
 * 2. レスポンスステータスチェック
 * 3. エラー時は詳細情報を含むFetchErrorをthrow
 * 4. 成功時はJSONデータを返却
 *
 * 特徴:
 * - 統一的なエラーハンドリング
 * - レスポンスの型安全性
 * - エラー詳細情報の保持
 */

export interface FetchError extends Error {
  info?: any;
  status?: number;
}

/**
 * HTTPリクエストを実行し、レスポンスを処理するfetcher関数
 * useSWRから呼び出され、統一的なエラーハンドリングを提供
 *
 * @param url - リクエスト先のURL
 * @returns Promise<T> - レスポンスデータ
 * @throws FetchError - HTTPエラーまたはレスポンス解析エラー
 */
export async function fetcher<T>(url: string): Promise<T> {
  // 1. fetch APIでHTTPリクエスト実行
  const response = await fetch(url);

  // 2. レスポンスステータスチェック
  if (!response.ok) {
    const error: FetchError = new Error(
      "An error occurred while fetching the data."
    );

    // 3. エラー詳細を取得
    try {
      error.info = await response.json(); // JSONエラーレスポンスを解析
    } catch {
      error.info = { message: response.statusText }; // JSON解析失敗時はステータステキストを使用
    }

    error.status = response.status; // HTTPステータスコードを保存
    throw error; // FetchErrorをthrow
  }

  // 4. 成功時はJSONデータを返却
  return response.json();
}
