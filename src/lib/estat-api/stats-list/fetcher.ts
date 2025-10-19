/**
 * e-Stat統計表リスト取得クラス
 * 責務: API通信とエラーハンドリング
 */

import { estatAPI } from "../client";
import { EstatStatsListResponse, GetStatsListParams } from "../types";
import { StatsListSearchOptions, PagingOptions } from "../types/stats-list";

/**
 * e-Stat APIエラーの種類
 */
export enum EstatErrorType {
  INVALID_APP_ID = "INVALID_APP_ID",
  NO_DATA_FOUND = "NO_DATA_FOUND",
  INVALID_PARAMETER = "INVALID_PARAMETER",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * e-Stat APIエラークラス
 */
export class EstatStatsListError extends Error {
  constructor(
    public type: EstatErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "EstatStatsListError";
  }
}

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
      console.log("🔵 Fetcher: リクエストパラメータ:", params);
      const startTime = Date.now();

      const response = await estatAPI.getStatsList(params);

      console.log("🔵 Fetcher: APIレスポンス受信:", response);

      // ステータスチェック
      const status = response.GET_STATS_LIST.RESULT.STATUS;
      const errorMsg = response.GET_STATS_LIST.RESULT.ERROR_MSG;

      console.log(
        `🔵 Fetcher: ステータス: ${status}, エラーメッセージ: ${errorMsg}`
      );

      if (status !== 0) {
        // エラーメッセージから種類を判定
        if (errorMsg.includes("アプリケーションID")) {
          throw new EstatStatsListError(
            EstatErrorType.INVALID_APP_ID,
            errorMsg
          );
        } else if (
          errorMsg.includes("該当するデータが存在しません") ||
          errorMsg.includes("該当データはありませんでした") ||
          errorMsg.includes(
            "正常に終了しましたが、該当データはありませんでした"
          )
        ) {
          throw new EstatStatsListError(EstatErrorType.NO_DATA_FOUND, errorMsg);
        } else if (errorMsg.includes("パラメータが不正")) {
          throw new EstatStatsListError(
            EstatErrorType.INVALID_PARAMETER,
            errorMsg
          );
        } else {
          throw new EstatStatsListError(EstatErrorType.UNKNOWN_ERROR, errorMsg);
        }
      }

      console.log(
        `✅ Fetcher: 統計表リスト取得完了 (${Date.now() - startTime}ms)`
      );
      return response;
    } catch (error) {
      console.error("❌ Fetcher: 統計表リスト取得失敗:", error);

      // EstatStatsListErrorの場合はそのままスロー
      if (error instanceof EstatStatsListError) {
        throw error;
      }

      // ネットワークエラー等の場合
      throw new EstatStatsListError(
        EstatErrorType.NETWORK_ERROR,
        `統計表リストの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error
      );
    }
  }

  /**
   * リトライ付き統計表リスト取得
   *
   * @param params - 検索パラメータ
   * @param maxRetries - 最大リトライ回数（デフォルト: 3）
   * @returns 統計表リストレスポンス
   */
  static async fetchStatsListWithRetry(
    params: Omit<GetStatsListParams, "appId">,
    maxRetries: number = 3
  ): Promise<EstatStatsListResponse> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(
          `🔵 Fetcher: 統計表リスト取得試行 ${attempt + 1}/${maxRetries}`
        );
        return await this.fetchStatsList(params);
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          console.error(`❌ Fetcher: 最大リトライ回数に到達 (${maxRetries}回)`);
          throw error;
        }

        // 指数バックオフで待機
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`⚠️ Fetcher: リトライ待機中... (${waitTime}ms)`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw new Error("Max retries exceeded");
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
      // searchKindを省略して全フィールドで検索（政府統計名、統計表題、項目名など）
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      // collectAreaは一時的に無効化（結果が0件になるため）
      // ...(options.collectArea &&
      //   options.collectArea !== "" && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    console.log("🔵 Fetcher: searchByKeyword パラメータ:", params);
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
      statsField: fieldCode, // fieldからstatsFieldに変更
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    return this.fetchStatsList(params);
  }

  /**
   * 集計地域区分で統計表を検索
   *
   * @param collectArea - 集計地域区分（1: 全国, 2: 都道府県, 3: 市区町村）
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async searchByCollectArea(
    collectArea: "1" | "2" | "3",
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      collectArea,
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.statsField && { statsField: options.statsField }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    return this.fetchStatsList(params);
  }

  /**
   * 統計名リストのみを取得
   *
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async fetchStatsNameList(
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      statsNameList: "Y",
      limit: options.limit || 1000,
      startPosition: options.startPosition || 1,
      ...(options.statsField && { statsField: options.statsField }),
      ...(options.statsCode && { statsCode: options.statsCode }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    console.log("🔵 Fetcher: fetchStatsNameList パラメータ:", params);
    return this.fetchStatsList(params);
  }

  /**
   * 更新された統計を取得
   *
   * @param since - 更新日（YYYY-MM-DD）
   * @param options - 検索オプション
   * @returns 統計表リストレスポンス
   */
  static async fetchUpdatedStats(
    since: string,
    options: StatsListSearchOptions = {}
  ): Promise<EstatStatsListResponse> {
    const params: Omit<GetStatsListParams, "appId"> = {
      updatedDate: since,
      limit: options.limit || 100,
      startPosition: options.startPosition || 1,
      ...(options.statsField && { statsField: options.statsField }),
      ...(options.statsCode && { statsCode: options.statsCode }),
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    console.log("🔵 Fetcher: fetchUpdatedStats パラメータ:", params);
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
