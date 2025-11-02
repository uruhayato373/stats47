import { executeHttpRequest } from "@/features/estat-api/core/client/http-client";
import {
  ESTAT_API,
  ESTAT_APP_ID,
  ESTAT_ENDPOINTS,
} from "@/features/estat-api/core/config";

import {
  findStatsDataByStatsIdAndParams,
  saveStatsDataCache,
} from "../repositories/stats-data-r2-cache-repository";
import {
  EstatStatsDataResponse,
  FetchOptions,
  FormattedEstatData,
  GetStatsDataParams,
} from "../types";

import { formatStatsData } from "./formatter";

/**
 * リクエストパラメータを構築
 *
 * @param params - 追加パラメータ
 * @param appId - アプリケーションID
 * @returns 完全なリクエストパラメータ
 */
function buildRequestParams(
  params: Record<string, unknown>,
  appId: string
): Record<string, unknown> {
  return {
    appId,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...params,
  };
}

/**
 * e-Stat APIの統計データレスポンスを検証し、エラーの場合にthrow
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @param url - リクエストURL（エラー詳細に含める）
 */
function validateStatsDataResponse(data: unknown, url: string): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // GET_STATS_DATA構造を確認
    if (obj.GET_STATS_DATA && typeof obj.GET_STATS_DATA === "object") {
      const statsData = obj.GET_STATS_DATA as Record<string, unknown>;
      const result = statsData.RESULT;

      if (result && typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;

        if (typeof resultObj.STATUS === "number") {
          // STATUS=1は警告（データは取得できている）なのでログのみ
          if (resultObj.STATUS === 1) {
            console.warn(
              "e-STAT API warning (STATUS=1):",
              resultObj.ERROR_MSG || "一部にエラーがあります"
            );
          }
          // STATUS>=100は実際のエラー
          else if (resultObj.STATUS >= 100) {
            const errorDetails = {
              STATUS: resultObj.STATUS,
              ERROR_MSG: resultObj.ERROR_MSG,
              URL: url,
              fullResponse: result,
            };
            console.error("e-STAT API error details:", errorDetails);
            throw new Error(
              `e-STAT API error (STATUS=${resultObj.STATUS}): ${
                resultObj.ERROR_MSG || "Unknown error"
              }`
            );
          }
        }
      }
    }
  }
}

/**
 * R2キャッシュから統計データを取得
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 統計データ、またはnull（見つからない場合）
 */
async function checkR2Cache(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<EstatStatsDataResponse | null> {
  try {
    return await findStatsDataByStatsIdAndParams(statsDataId, options);
  } catch (err) {
    // R2設定がない場合は警告のみ表示
    if (err instanceof Error && err.message.includes("R2 S3設定")) {
      console.log("R2設定がないためキャッシュ確認をスキップ:", statsDataId);
    } else {
      console.warn("R2キャッシュ確認失敗（無視）:", err);
    }
    return null;
  }
}

/**
 * R2キャッシュに統計データを保存（バックグラウンド、エラーハンドリング付き）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @param data - 保存する統計データ
 */
async function saveToR2Cache(
  statsDataId: string,
  options: FetchOptions,
  data: EstatStatsDataResponse
): Promise<void> {
  try {
    await saveStatsDataCache(statsDataId, options, data);
    console.log("✅ R2バックグラウンド保存完了:", statsDataId);
  } catch (err) {
    // R2設定がない場合は警告のみ表示
    if (err instanceof Error && err.message.includes("R2 S3設定")) {
      console.log("R2設定がないため保存をスキップ:", statsDataId);
    } else {
      console.warn("R2保存失敗（無視）:", err);
    }
  }
}

/**
 * 統計データ取得の共通ロジック（内部関数）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @param includeSource - 取得元情報を含めるかどうか
 * @returns 統計データ（取得元情報付きの場合あり）
 * @throws {Error} API呼び出しが失敗した場合
 */
async function fetchStatsDataInternal(
  statsDataId: string,
  options: FetchOptions = {},
  includeSource: boolean
): Promise<EstatStatsDataResponse | FetchStatsDataResult> {
  try {
    console.log(`🔵 Fetcher: 統計データ取得開始 - ${statsDataId}`);
    const startTime = Date.now();

    // 1. R2キャッシュを確認
    const cached = await checkR2Cache(statsDataId, options);
    if (cached) {
      console.log(
        `✅ Fetcher: R2キャッシュから取得 (${Date.now() - startTime}ms)`
      );
      if (includeSource) {
        return { data: cached, source: "r2" };
      }
      return cached;
    }

    // 2. e-Stat APIから取得
    const params: Omit<GetStatsDataParams, "appId"> = {
      statsDataId,
      metaGetFlg: "Y",
      cntGetFlg: "N",
      explanationGetFlg: "N",
      annotationGetFlg: "N",
      replaceSpChars: "0",
      startPosition: 1,
      limit: options.limit || 10000,
      ...(options.categoryFilter && { cdCat01: options.categoryFilter }),
      ...(options.yearFilter && { cdTime: options.yearFilter }),
      ...(options.areaFilter && { cdArea: options.areaFilter }),
    };

    const requestParams = buildRequestParams(params, ESTAT_APP_ID);
    const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`;

    const response = await executeHttpRequest<EstatStatsDataResponse>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      requestParams
    );

    validateStatsDataResponse(response, url);

    // 3. バックグラウンドでR2に保存（awaitしない）
    void saveToR2Cache(statsDataId, options, response);

    console.log(`✅ Fetcher: 統計データ取得完了 (${Date.now() - startTime}ms)`);

    if (includeSource) {
      return { data: response, source: "api" };
    }
    return response;
  } catch (error) {
    console.error("❌ Fetcher: 統計データ取得失敗:", error);
    console.error("Error details:", {
      statsDataId,
      options,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `統計データの取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 統計データを取得（生データ）
 * R2キャッシュ優先、キャッシュミス時はe-Stat APIから取得
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 統計データのAPIレスポンス
 * @throws {Error} API呼び出しが失敗した場合
 */
export async function fetchStatsData(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<EstatStatsDataResponse> {
  const result = await fetchStatsDataInternal(statsDataId, options, false);
  return result as EstatStatsDataResponse;
}

/**
 * 統計データ取得元の種類
 */
export type StatsDataSource = "r2" | "api";

/**
 * 統計データと取得元を含む結果
 */
export interface FetchStatsDataResult {
  /** 統計データのAPIレスポンス */
  data: EstatStatsDataResponse;
  /** データの取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  source: StatsDataSource;
}

/**
 * 統計データを取得（R2キャッシュ優先、取得元情報付き）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 統計データと取得元情報
 * @throws {Error} API呼び出しが失敗した場合
 */
export async function fetchStatsDataWithSource(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<FetchStatsDataResult> {
  const result = await fetchStatsDataInternal(statsDataId, options, true);
  return result as FetchStatsDataResult;
}

/**
 * 統計データを取得して整形（便利メソッド）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 整形された統計データ
 */
export async function fetchFormattedStatsData(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<FormattedEstatData> {
  const response = await fetchStatsData(statsDataId, options);
  return formatStatsData(response);
}
