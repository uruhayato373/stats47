/**
 * e-STATメタ情報取得ユーティリティ
 * 責務: API通信とエラーハンドリング
 */

import { executeHttpRequest } from "@/features/estat-api/core/client/http-client";
import {
  ESTAT_API,
  ESTAT_APP_ID,
  ESTAT_ENDPOINTS,
} from "@/features/estat-api/core/config";
import { EstatMetaInfoFetchError } from "@/features/estat-api/core/errors";
import type { EstatMetaCategoryData } from "@/features/estat-api/stats-data/types/stats-data-response";

import {
  findMetaInfoByStatsId,
  saveMetaInfoCache,
} from "../repositories/meta-info-r2-cache-repository";

import { extractCategories } from "./formatter";

import type { EstatMetaInfoResponse } from "../types";

/**
 * リクエストパラメータを構築
 *
 * @param params - 追加パラメータ
 * @param appId - アプリケーションID
 * @returns 完全なリクエストパラメータ
 */
function composeRequestParams(
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
 * e-Stat APIのメタ情報レスポンスを検証し、エラーの場合にthrow
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @param url - リクエストURL（エラー詳細に含める）
 */
function validateMetaInfoResponse(data: unknown, url: string): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // GET_META_INFO構造を確認
    if (obj.GET_META_INFO && typeof obj.GET_META_INFO === "object") {
      const metaInfo = obj.GET_META_INFO as Record<string, unknown>;
      const result = metaInfo.RESULT;

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
 * R2キャッシュからメタ情報を取得
 *
 * @param statsDataId - 統計表ID
 * @returns キャッシュされたメタ情報、または存在しない場合はnull
 */
async function checkR2Cache(
  statsDataId: string
): Promise<EstatMetaInfoResponse | null> {
  try {
    const cached = await findMetaInfoByStatsId(statsDataId);
    if (cached) {
      console.log("✅ R2キャッシュヒット:", statsDataId);
      return cached;
    }
    console.log("R2キャッシュミス、e-Stat APIから取得:", statsDataId);
    return null;
  } catch (error) {
    // R2設定がない場合も継続（ローカル開発環境でのフォールバック）
    console.warn(
      "R2キャッシュ取得エラー、e-Stat APIへフォールバック:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * e-Stat APIからメタ情報を取得
 *
 * @param statsDataId - 統計表ID
 * @returns メタ情報のAPIレスポンス
 * @throws {EstatMetaInfoFetchError} API呼び出しが失敗した場合
 */
async function fetchMetaInfoFromEstatApi(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  const params = { statsDataId };
  const requestParams = composeRequestParams(params, ESTAT_APP_ID);
  const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_META_INFO}`;

  const data = await executeHttpRequest<EstatMetaInfoResponse>(
    ESTAT_API.BASE_URL,
    ESTAT_ENDPOINTS.GET_META_INFO,
    requestParams
  );

  validateMetaInfoResponse(data, url);

  return data;
}

/**
 * R2キャッシュにメタ情報を保存（バックグラウンド、エラーハンドリング付き）
 *
 * @param statsDataId - 統計表ID
 * @param data - 保存するメタ情報
 */
async function saveToR2Cache(
  statsDataId: string,
  data: EstatMetaInfoResponse
): Promise<void> {
  try {
    await saveMetaInfoCache(statsDataId, data);
    console.log("✅ R2バックグラウンド保存完了:", statsDataId);
  } catch (err) {
    // R2設定がない場合は警告のみ表示
    if (err instanceof Error && err.message.includes("R2 S3設定")) {
      console.log("R2設定がないためスキップ:", statsDataId);
    } else {
      console.warn("R2保存失敗（無視）:", err);
    }
  }
}

/**
 * APIからメタ情報を取得（R2キャッシュ優先）
 *
 * @param statsDataId - 統計表ID
 * @returns メタ情報のAPIレスポンス
 * @throws {EstatMetaInfoFetchError} API呼び出しが失敗した場合
 */
export async function fetchMetaInfo(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  // 1. R2キャッシュを確認
  const cached = await checkR2Cache(statsDataId);
  if (cached) {
    return cached;
  }

  // 2. e-Stat APIから取得
  try {
    const data = await fetchMetaInfoFromEstatApi(statsDataId);

    // 3. バックグラウンドでR2に保存（awaitしない）
    void saveToR2Cache(statsDataId, data);

    return data;
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      `メタ情報の取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      statsDataId,
      error
    );
  }
}

/**
 * メタ情報取得元の種類
 */
export type MetaInfoSource = "r2" | "api";

/**
 * メタ情報と取得元を含む結果
 */
export interface FetchMetaInfoResult {
  /** メタ情報のAPIレスポンス */
  data: EstatMetaInfoResponse;
  /** データの取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  source: MetaInfoSource;
}

/**
 * APIからメタ情報を取得（R2キャッシュ優先、取得元情報付き）
 *
 * @param statsDataId - 統計表ID
 * @returns メタ情報のAPIレスポンスと取得元情報
 * @throws {EstatMetaInfoFetchError} API呼び出しが失敗した場合
 */
export async function fetchMetaInfoWithSource(
  statsDataId: string
): Promise<FetchMetaInfoResult> {
  // 1. R2キャッシュを確認
  const cached = await checkR2Cache(statsDataId);
  if (cached) {
    return { data: cached, source: "r2" };
  }

  // 2. e-Stat APIから取得
  try {
    const data = await fetchMetaInfoFromEstatApi(statsDataId);

    // 3. バックグラウンドでR2に保存（awaitしない）
    void saveToR2Cache(statsDataId, data);

    return { data, source: "api" };
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      `メタ情報の取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      statsDataId,
      error
    );
  }
}

/**
 * メタ情報を取得して変換（便利メソッド）
 *
 * @param statsDataId - 統計表ID
 * @returns 変換されたメタデータエントリの配列
 */
export async function fetchAndTransformMetaInfo(
  statsDataId: string
): Promise<EstatMetaCategoryData[]> {
  const response = await fetchMetaInfo(statsDataId);
  return extractCategories(response).map((category) => ({
    stats_data_id: statsDataId,
    stat_name: response.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$ || "",
    title: response.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE?.$ || "",
    cat01: category.id,
    item_name: category.name,
    unit: null,
  }));
}
