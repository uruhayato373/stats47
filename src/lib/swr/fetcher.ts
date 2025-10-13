/**
 * useSWR用のfetcher関数
 * エラー情報を含む統一的なfetch処理
 */

export interface FetchError extends Error {
  info?: any;
  status?: number;
}

export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error: FetchError = new Error(
      "An error occurred while fetching the data."
    );

    // エラー詳細を取得
    try {
      error.info = await response.json();
    } catch {
      error.info = { message: response.statusText };
    }

    error.status = response.status;
    throw error;
  }

  return response.json();
}
