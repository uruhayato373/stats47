/**
 * stats-list用SWR fetcher関数
 * 責務: キャッシュキーからAPIリクエストを実行し、フォーマット済みデータを返却
 */

import { StatsListSearchResult } from "../types";

import { logger } from "@stats47/logger";


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
  logger.debug({ cacheKey }, "SWR Fetcher: 開始");

  // キャッシュキーから検索オプションを復元
  const options = parseStatsListCacheKey(cacheKey);
  if (!options) {
    throw new Error(`無効なキャッシュキー: ${cacheKey}`);
  }

  logger.debug({ options }, "SWR Fetcher: 検索オプション復元");

  try {
    // 検索オプションに基づいて適切なメソッドを選択
    let response;

    if (options.searchWord) {
      // キーワード検索
      logger.debug({ searchWord: options.searchWord }, "SWR Fetcher: キーワード検索実行");
      response = await EstatStatsListFetcher.searchByKeyword(
        options.searchWord,
        {
          limit: options.limit || 100,
          ...(options.statsField && { statsField: options.statsField }),
          ...(options.statsCode && { statsCode: options.statsCode }),
          ...(options.collectArea && { collectArea: options.collectArea }),
          ...(options.surveyYears && { surveyYears: options.surveyYears }),
        }
      );
    } else if (options.statsCode) {
      // 政府統計コード検索
      logger.debug({ statsCode: options.statsCode }, "SWR Fetcher: 政府統計コード検索実行");
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
      logger.debug({ statsField: options.statsField }, "SWR Fetcher: 分野別検索実行");
      response = await EstatStatsListFetcher.searchByField(options.statsField, {
        limit: options.limit || 100,
        ...(options.collectArea && { collectArea: options.collectArea }),
        ...(options.surveyYears && { surveyYears: options.surveyYears }),
      });
    } else if (options.collectArea) {
      // 集計地域区分検索
      logger.debug({ collectArea: options.collectArea }, "SWR Fetcher: 集計地域区分検索実行");
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
      logger.debug("SWR Fetcher: デフォルト検索実行");
      response = await EstatStatsListFetcher.fetchStatsList({
        limit: options.limit || 100,
        ...(options.surveyYears && { surveyYears: options.surveyYears }),
      });
    }

    logger.debug({ response }, "SWR Fetcher: APIレスポンス受信");

    // 結果をフォーマット
    const formattedResult =
      EstatStatsListFormatter.formatStatsListData(response);

    logger.info(
      {
        tablesCount: formattedResult.tables.length,
        totalCount: formattedResult.totalCount,
      },
      "SWR Fetcher: 完了"
    );

    return formattedResult;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "SWR Fetcher: エラー"
    );
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

    logger.error(
      {
        cacheKey,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "SWR Fetcher: エラーハンドリング"
    );

    throw new Error(errorMessage);
  }
}
