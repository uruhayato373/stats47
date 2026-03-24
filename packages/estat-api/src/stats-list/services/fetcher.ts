/**
 * e-Stat統計表リスト取得クラス
 * 責務: API通信とエラーハンドリング
 */


import { executeHttpRequest } from "../../core/client/http-client";
import {
    ESTAT_API,
    ESTAT_API_CONFIG,
    ESTAT_APP_ID,
    ESTAT_ENDPOINTS,
} from "../../core/config";
import {
    EstatStatsListResponse,
    GetStatsListParams,
    PagingOptions,
    StatsListSearchOptions,
} from "../types";

import { logger } from "@stats47/logger";

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
 * リクエストパラメータを構築
 *
 * @param params - 追加パラメータ
 * @param appId - アプリケーションID
 * @returns 完全なリクエストパラメータ
 */
/**
 * e-Stat APIパラメータ名のマッピング
 *
 * e-Stat API仕様によると、リクエストパラメータはcamelCase形式を使用します。
 * UPPER_SNAKE_CASEはレスポンスのXML/JSONタグで使用される形式であり、
 * リクエストパラメータでは使用しません。
 *
 * 参考: https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
 * - リクエストパラメータ: statsField, statsCode, searchWord, collectArea, limit など
 * - レスポンスタグ: STATS_FIELD, STATS_CODE, SEARCH_WORD, COLLECT_AREA, LIMIT など
 *
 * このため、パラメータ名の変換は不要であり、そのまま使用します。
 */
function mapParameterNames(
  params: Record<string, unknown>
): Record<string, unknown> {
  // e-Stat APIはcamelCase形式のパラメータ名を期待しているため、
  // パラメータ名はそのまま使用する
  return params;
}

function composeRequestParams(
  params: Record<string, unknown>,
  appId: string
): Record<string, unknown> {
  // e-Stat APIのgetStatsListエンドポイントは大文字のパラメータ名を要求する可能性がある
  // Web検索結果と実際のAPIレスポンスを確認して判断
  // パラメータ名マッピングを有効化（LIMIT、FIELDなどが正しく送信されるように）
  const mappedParams = mapParameterNames(params);

  logger.debug({ params }, "composeRequestParams: マッピング前");
  logger.debug({ mappedParams }, "composeRequestParams: マッピング後");

  return {
    appId,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...mappedParams,
  };
}

/**
 * e-Stat APIの統計表リストレスポンスを検証し、エラーの場合にthrow
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @param url - リクエストURL（エラー詳細に含める）
 */
function validateStatsListResponse(data: unknown, url: string): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // GET_STATS_LIST構造を確認
    if (obj.GET_STATS_LIST && typeof obj.GET_STATS_LIST === "object") {
      const statsList = obj.GET_STATS_LIST as Record<string, unknown>;
      const result = statsList.RESULT;

      if (result && typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;

        if (typeof resultObj.STATUS === "number") {
          // STATUS=1は警告（データは取得できている）なのでログのみ
          if (resultObj.STATUS === 1) {
            logger.warn(
              {
                status: resultObj.STATUS,
                errorMsg: resultObj.ERROR_MSG || "一部にエラーがあります",
              },
              "e-STAT API警告"
            );
          }
          // STATUS>=100は実際のエラー
          else if (resultObj.STATUS >= 100) {
            const errorDetails = {
              status: resultObj.STATUS,
              errorMsg: resultObj.ERROR_MSG,
              url,
              fullResponse: result,
            };
            logger.error(errorDetails, "e-STAT APIエラー");
            throw new Error(
              `e-STAT APIエラー (STATUS=${resultObj.STATUS}): ${
                resultObj.ERROR_MSG || "不明なエラー"
              }`
            );
          }
        }
      }
    }
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
      logger.debug("統計表リスト取得開始");
      logger.debug({ params }, "Fetcher: リクエストパラメータ");
      logger.debug(
        {
          hasLimit: "limit" in params,
          limit: params.limit,
          hasStartPosition: "startPosition" in params,
          startPosition: params.startPosition,
          statsField: params.statsField,
          allKeys: Object.keys(params),
        },
        "Fetcher: リクエストパラメータ詳細"
      );
      const startTime = Date.now();

      const requestParams = composeRequestParams(params, ESTAT_APP_ID);
      logger.debug({ requestParams }, "Fetcher: composeRequestParams後のパラメータ");
      logger.debug(
        {
          hasLimit: "LIMIT" in requestParams || "limit" in requestParams,
          LIMIT: requestParams.LIMIT || requestParams.limit,
          hasStartPosition:
            "START_POSITION" in requestParams || "startPosition" in requestParams,
          START_POSITION:
            requestParams.START_POSITION || requestParams.startPosition,
          hasFIELD:
            "FIELD" in requestParams ||
            "statsField" in requestParams ||
            "field" in requestParams,
          FIELD:
            requestParams.FIELD ||
            requestParams.statsField ||
            requestParams.field,
          allKeys: Object.keys(requestParams),
        },
        "Fetcher: composeRequestParams後のパラメータ詳細"
      );
      const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_LIST}`;

      const response = await executeHttpRequest<EstatStatsListResponse>(
        ESTAT_API.BASE_URL,
        ESTAT_ENDPOINTS.GET_STATS_LIST,
        requestParams,
        ESTAT_API_CONFIG.REQUEST_TIMEOUT_MS
      );

      logger.debug("Fetcher: APIレスポンス受信");
      logger.debug(
        {
          hasGET_STATS_LIST: !!response.GET_STATS_LIST,
          hasDATALIST_INF: !!response.GET_STATS_LIST?.DATALIST_INF,
          NUMBER: response.GET_STATS_LIST?.DATALIST_INF?.NUMBER,
          hasRESULT_INF: !!response.GET_STATS_LIST?.DATALIST_INF?.RESULT_INF,
          hasTABLE_INF:
            !!response.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF,
          tableInfType: response.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF
            ? Array.isArray(
                response.GET_STATS_LIST.DATALIST_INF.TABLE_INF
              )
              ? "配列"
              : typeof response.GET_STATS_LIST.DATALIST_INF.TABLE_INF
            : "存在しない",
          tableInfLength: Array.isArray(
            response.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF
          )
            ? response.GET_STATS_LIST.DATALIST_INF.TABLE_INF.length
            : response.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF
            ? 1
            : 0,
        },
        "Fetcher: レスポンス構造"
      );

      validateStatsListResponse(response, url);

      const duration = Date.now() - startTime;
      logger.info({ duration }, `統計表リスト取得完了 (${duration}ms)`);
      return response;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        },
        "Fetcher: 統計表リスト取得失敗"
      );

      // EstatStatsListErrorの場合はそのままスロー
      if (error instanceof EstatStatsListError) {
        throw error;
      }

      // エラーメッセージから種類を判定
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("アプリケーションID")) {
        throw new EstatStatsListError(
          EstatErrorType.INVALID_APP_ID,
          errorMessage
        );
      } else if (
        errorMessage.includes("該当するデータが存在しません") ||
        errorMessage.includes("該当データはありませんでした") ||
        errorMessage.includes(
          "正常に終了しましたが、該当データはありませんでした"
        )
      ) {
        throw new EstatStatsListError(
          EstatErrorType.NO_DATA_FOUND,
          errorMessage
        );
      } else if (errorMessage.includes("パラメータが不正")) {
        throw new EstatStatsListError(
          EstatErrorType.INVALID_PARAMETER,
          errorMessage
        );
      }

      // ネットワークエラー等の場合
      throw new EstatStatsListError(
        EstatErrorType.NETWORK_ERROR,
        `統計表リストの取得に失敗しました: ${errorMessage}`,
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
        logger.debug(
          { attempt: attempt + 1, maxRetries },
          `統計表リスト取得試行 ${attempt + 1}/${maxRetries}`
        );
        return await this.fetchStatsList(params);
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          logger.error({ maxRetries }, `最大リトライ回数に到達 (${maxRetries}回)`);
          throw error;
        }

        // 指数バックオフで待機
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.warn({ waitTime }, `リトライ待機中... (${waitTime}ms)`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw new Error("最大リトライ回数を超過しました");
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
      ...(options.statsField && { statsField: options.statsField }),
      ...(options.statsCode && { statsCode: options.statsCode }),
      ...(options.collectArea && { collectArea: options.collectArea }),
      ...(options.surveyYears && { surveyYears: options.surveyYears }),
      ...(options.openYears && { openYears: options.openYears }),
    };

    logger.debug({ params }, "Fetcher: searchByKeyword パラメータ");
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

    logger.debug(
      {
        fieldCode,
        options,
        params,
      },
      "Fetcher: searchByField パラメータ"
    );
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

    logger.debug({ params }, "Fetcher: fetchStatsNameList パラメータ");
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

    logger.debug({ params }, "Fetcher: fetchUpdatedStats パラメータ");
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
    let firstResponse: EstatStatsListResponse | null = null;

    logger.debug({ maxResults }, `ページング処理開始 - 最大${maxResults}件`);

    while (allTables.length < maxResults) {
      const response = await this.fetchStatsList({
        ...baseParams,
        startPosition,
        limit: Math.min(batchSize, maxResults - allTables.length),
      });

      // 最初のレスポンスを保存（後でレスポンス構築に使用）
      if (!firstResponse) {
        firstResponse = response;
      }

      const datalist = response.GET_STATS_LIST.DATALIST_INF;
      const tables = datalist.TABLE_INF;

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

    logger.info({ count: allTables.length }, `ページング処理完了 - ${allTables.length}件取得`);

    // 最初のレスポンスをベースに、全データを含むレスポンスを構築
    if (!firstResponse) {
      throw new Error("最初のレスポンスが取得できませんでした");
    }

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
          TABLE_INF: allTables,
        },
      },
    };
  }
}
