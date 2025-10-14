/**
 * e-Stat統計表リスト取得クラス
 * 責務: API通信とエラーハンドリング
 */

import { estatAPI } from "../client";
import { EstatStatsListResponse, GetStatsListParams } from "../types";
import { StatsListSearchOptions, PagingOptions } from "../types/stats-list";

/**
 * e-Stat統計表リスト取得クラス
 * 責務: API通信とエラーハンドリング
 */
export class EstatStatsListFetcher {
  /**
   * 統計表リストを取得
   *
   * @param params - 検索パラメータ
   * @returns 統計表リストレスポンス
   */
  static async fetchStatsList(
    params: Omit<GetStatsListParams, "appId">
  ): Promise<EstatStatsListResponse> {
    try {
      console.log("🔵 Fetcher: 統計表リスト取得開始");
      const startTime = Date.now();

      const response = await estatAPI.getStatsList(params);

      console.log(
        `✅ Fetcher: 統計表リスト取得完了 (${Date.now() - startTime}ms)`
      );
      return response;
    } catch (error) {
      console.error("❌ Fetcher: 統計表リスト取得失敗:", error);
      throw new Error(
        `統計表リストの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * キーワードで統計表を検索
   *
   * @param keyword - 検索キーワード
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async searchByKeyword(
    keyword: string,
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      searchWord: keyword,
      searchKind: "1", // AND検索
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    return this.fetchStatsList(params);
  }

  /**
   * 政府統計コードで統計表を検索
   *
   * @param statsCode - 政府統計コード
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async searchByStatsCode(
    statsCode: string,
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      statsCode,
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    return this.fetchStatsList(params);
  }

  /**
   * 分野コードで統計表を検索
   *
   * @param fieldCode - 分野コード
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async searchByField(
    fieldCode: string,
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      field: fieldCode,
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    return this.fetchStatsList(params);
  }

  /**
   * ページング処理で全データを取得
   *
   * @param baseParams - 基本検索パラメータ
   * @param options - ページングオプション
   * @returns 統計表リストレスポンス
   */
  static async fetchAllWithPaging(
    baseParams: Omit<GetStatsListParams, "appId">,
    options: PagingOptions = {}
  ): Promise<EstatStatsListResponse> {
    const { maxResults = 10000, batchSize = 1000, delayMs = 100 } = options;
    const allTables: any[] = [];
    let startPosition = 1;
    let totalCount = 0;

    console.log(`🔵 Fetcher: ページング処理開始 - 最大${maxResults}件`);

    while (allTables.length < maxResults) {
      const response = await this.fetchStatsList({
        ...baseParams,
        startPosition,
        limit: Math.min(batchSize, maxResults - allTables.length),
      });

      const datalist = response.GET_STATS_LIST.DATALIST_INF;
      const tables = datalist.LIST_INF?.TABLE_INF;

      if (!tables) break;

      const tableArray = Array.isArray(tables) ? tables : [tables];
      allTables.push(...tableArray);
      totalCount = datalist.NUMBER;

      // 次のページがない場合は終了
      if (!datalist.RESULT_INF?.NEXT_KEY || allTables.length >= totalCount) {
        break;
      }

      startPosition = datalist.RESULT_INF.NEXT_KEY;

      // API制限を考慮した遅延
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(`✅ Fetcher: ページング処理完了 - ${allTables.length}件取得`);

    // 最初のレスポンスをベースに、全データを含むレスポンスを構築
    const firstResponse = await this.fetchStatsList({
      ...baseParams,
      startPosition: 1,
      limit: 1,
    });

    return {
      ...firstResponse,
      GET_STATS_LIST: {
        ...firstResponse.GET_STATS_LIST,
        DATALIST_INF: {
          NUMBER: totalCount,
          RESULT_INF: {
            FROM_NUMBER: 1,
            TO_NUMBER: allTables.length,
          },
          LIST_INF: {
            TABLE_INF: allTables,
          },
        },
      },
    };
  }
}
