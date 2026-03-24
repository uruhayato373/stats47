import { ESTAT_API, ESTAT_ENDPOINTS } from "../config/index";
import type { HttpRequestCacheOptions } from "./http-client";
import { executeHttpRequest } from "./http-client";

export const estatAPI = {
  /**
   * メタ情報を取得
   */
  getMetaInfo: async <T>(statsDataId: string, cacheOptions?: HttpRequestCacheOptions) => {
    return executeHttpRequest<T>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_META_INFO,
      { statsDataId },
      30000,
      cacheOptions
    );
  },

  /**
   * 統計データを取得
   */
  getStatsData: async <T>(params: Record<string, unknown>, cacheOptions?: HttpRequestCacheOptions) => {
    return executeHttpRequest<T>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      params,
      60000,
      cacheOptions
    );
  },

  /**
   * 統計表一覧を取得
   */
  getStatsList: async <T>(params: Record<string, unknown>, cacheOptions?: HttpRequestCacheOptions) => {
    return executeHttpRequest<T>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_STATS_LIST,
      params,
      30000,
      cacheOptions
    );
  }
};
