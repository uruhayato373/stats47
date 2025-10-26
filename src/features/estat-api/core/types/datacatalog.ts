import { EstatResult, EstatTextNode } from "./common";

/**
 * getDataCatalog APIパラメータ
 */
export interface GetDataCatalogParams {
  appId: string; // アプリケーションID
  statsDataId: string; // 統計表ID
  lang?: "J" | "E"; // 言語（デフォルト:J）
}

/**
 * getDataCatalog APIのレスポンス型
 * 統計表ファイル（Excel、CSV、PDF）の取得
 */
export interface EstatDataCatalogResponse {
  GET_DATA_CATALOG: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: "J" | "E";
      DATA_FORMAT: "X" | "J";
      STATS_DATA_ID: string;
    };
    DATA_CATALOG_LIST_INF: {
      DATA_CATALOG_INF?: EstatDataCatalogItem | EstatDataCatalogItem[];
    };
  };
}

/**
 * データカタログ項目
 */
export interface EstatDataCatalogItem {
  "@id": string; // ファイルID
  STAT_NAME: EstatTextNode; // 政府統計名
  GOV_ORG: EstatTextNode; // 作成機関
  STATISTICS_NAME: string; // 提供統計名
  TITLE: EstatTextNode; // ファイル名
  CYCLE?: string; // 周期
  SURVEY_DATE?: string; // 調査年月
  OPEN_DATE?: string; // 公開日
  LANGUAGE?: string; // 言語
  FILE_FORMAT?: "XLS" | "CSV" | "PDF"; // ファイル形式
  ESTAT_URL?: string; // e-StatのURL
  DESCRIPTION?: string; // 説明
}
