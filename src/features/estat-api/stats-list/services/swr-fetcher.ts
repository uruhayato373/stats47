/**
 * stats-list用SWR fetcher関数
 * 責務: キャッシュキーからAPIリクエストを実行し、フォーマット済みデータを返却
 */

import { StatsListSearchResult } from "../../types";
import { parseStatsListCacheKey } from "./cache-key";

import { EstatStatsListFetcher } from "./fetcher";
import { EstatStatsListFormatter } from "./formatter";

/**
 * SWR用のfetcher関数
 * キャッシュキーから検索オプションを復元し、APIリクエストを実行
 *
 * @param cacheKey - キャッシュキー（URL形式）
 * @returns フォーマット済み検索結果
 */
export async function statsListFetcher(
  cacheKey: string
): Promise<StatsListSearchResult> {
  console.log("🔵 SWR Fetcher: 開始", cacheKey);

  // キャッシュキーから検索オプションを復元
  const options = parseStatsListCacheKey(cacheKey);
  if (!options) {
    throw new Error(`Invalid cache key: ${cacheKey}`);
  }

  console.log("🔵 SWR Fetcher: 検索オプション復元", options);

  try {
    // 検索オプションに基づいて適切なメソッドを選択
    let response;

    if (options.searchWord) {
      // キーワード検索
      console.log("🔵 SWR Fetcher: キーワード検索実行", options.searchWord);
      response = await EstatStatsListFetcher.searchByKeyword(
        options.searchWord,
        {
          limit: options.limit || 100,
          ...(options.statsField && { statsField: options.statsField }),
          ...(options.collectArea && { collectArea: options.collectArea }),
          ...(options.surveyYears && { surveyYears: options.surveyYears }),
        }
      );
    } else if (options.statsCode) {
      // 政府統計コード検索
      console.log("🔵 SWR Fetcher: 政府統計コード検索実行", options.statsCode);
      response = await EstatStatsListFetcher.searchByStatsCode(
        options.statsCode,
        {
          limit: options.limit || 100,
          ...(options.statsField && { statsField: options.statsField }),
          ...(options.collectArea && { collectArea: options.collectArea }),
          ...(options.surveyYears && { surveyYears: options.surveyYears }),
        }
      );
    } else if (options.statsField) {
      // 分野別検索
      console.log("🔵 SWR Fetcher: 分野別検索実行", options.statsField);
      response = await EstatStatsListFetcher.searchByField(options.statsField, {
        limit: options.limit || 100,
        ...(options.collectArea && { collectArea: options.collectArea }),
        ...(options.surveyYears && { surveyYears: options.surveyYears }),
      });
    } else if (options.collectArea) {
      // 集計地域区分検索
      console.log("🔵 SWR Fetcher: 集計地域区分検索実行", options.collectArea);
      response = await EstatStatsListFetcher.searchByCollectArea(
        options.collectArea,
        {
          limit: options.limit || 100,
          ...(options.statsField && { statsField: options.statsField }),
          ...(options.surveyYears && { surveyYears: options.surveyYears }),
        }
      );
    } else {
      // デフォルト検索（全件取得）
      console.log("🔵 SWR Fetcher: デフォルト検索実行");
      response = await EstatStatsListFetcher.fetchStatsList({
        limit: options.limit || 100,
        ...(options.surveyYears && { surveyYears: options.surveyYears }),
      });
    }

    console.log("🔵 SWR Fetcher: APIレスポンス受信", response);

    // 結果をフォーマット
    const formattedResult =
      EstatStatsListFormatter.formatStatsListData(response);

    console.log("✅ SWR Fetcher: 完了", {
      tablesCount: formattedResult.tables.length,
      totalCount: formattedResult.totalCount,
    });

    return formattedResult;
  } catch (error) {
    console.error("❌ SWR Fetcher: エラー", error);
    throw error;
  }
}

/**
 * エラーハンドリング付きfetcher関数
 * エラーを適切にフォーマットして再スロー
 *
 * @param cacheKey - キャッシュキー
 * @returns フォーマット済み検索結果
 */
export async function statsListFetcherWithErrorHandling(
  cacheKey: string
): Promise<StatsListSearchResult> {
  try {
    return await statsListFetcher(cacheKey);
  } catch (error) {
    // エラーを適切にフォーマット
    const errorMessage =
      error instanceof Error
        ? error.message
        : "統計表リストの取得に失敗しました";

    console.error("❌ SWR Fetcher: エラーハンドリング", {
      cacheKey,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  }
}
