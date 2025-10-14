/**
 * e-Stat統計表リスト共通型定義
 */

import { EstatResult, EstatTextNode } from "./common";

/**
 * getStatsList APIパラメータ
 */
export interface GetStatsListParams {
  appId: string; // アプリケーションID

  // 検索条件
  searchKind?: "1" | "2" | "3"; // 検索種別（1:政府統計名、2:統計表題、3:項目名）
  surveyYears?: string; // 調査年月（YYYY、YYYYMM、YYYY-YYYY）
  openYears?: string; // 公開年月（YYYY、YYYYMM、YYYY-YYYY）
  updatedDate?: string; // 更新日付（YYYY-MM-DD、YYYY-MM-DD-YYYY-MM-DD）
  statsCode?: string; // 政府統計コード
  searchWord?: string; // キーワード
  statsName?: string; // 政府統計名
  govOrg?: string; // 作成機関
  statsNameList?: string; // 提供統計名
  title?: string; // 統計表題
  explanation?: string; // 統計表の説明
  field?: string; // 分野
  layout?: string; // 統計大分類
  toukei?: string; // 統計小分類

  // ページング
  startPosition?: number; // データ開始位置（デフォルト:1）
  limit?: number; // データ取得件数（デフォルト:100）

  // 出力オプション
  lang?: "J" | "E"; // 言語（デフォルト:J）
  replaceSpChars?: "0" | "1" | "2"; // 特殊文字置換
}

/**
 * getStatsList APIのレスポンス型
 * 統計表の検索
 */
export interface EstatStatsListResponse {
  GET_STATS_LIST: {
    RESULT: EstatResult;
    PARAMETER: EstatStatsListParameter;
    DATALIST_INF: {
      NUMBER: number; // 統計表数
      RESULT_INF?: {
        // LIMIT指定時
        FROM_NUMBER: number;
        TO_NUMBER: number;
      };
      LIST_INF?: {
        // 統計表リスト（0件の場合は存在しない）
        TABLE_INF?: EstatTableListItem | EstatTableListItem[];
      };
    };
  };
}

/**
 * getStatsList パラメータ
 */
export interface EstatStatsListParameter {
  LANG: "J" | "E";
  DATA_FORMAT: "X" | "J";
  SEARCH_KIND: "1" | "2" | "3"; // 検索種別
  REPLACE_SP_CHARS: "0" | "1" | "2";
  // 検索条件
  SURVEY_YEARS?: string; // 調査年月
  OPEN_YEARS?: string; // 公開年月
  UPDATED_DATE?: string; // 更新日付
  STATS_CODE?: string; // 政府統計コード
  SEARCH_WORD?: string; // キーワード
  STATS_NAME?: string; // 政府統計名
  GOV_ORG?: string; // 作成機関
  STATS_NAME_LIST?: string; // 提供統計名
  TITLE?: string; // 統計表題
  EXPLANATION?: string; // 統計表の説明
  FIELD?: string; // 分野
  LAYOUT?: string; // 統計大分類
  TOUKEI?: string; // 統計小分類
  // ページング
  START_POSITION?: number;
  LIMIT?: number;
}

/**
 * 統計表リスト項目
 */
export interface EstatTableListItem {
  "@id": string; // 統計表ID
  STAT_NAME: EstatTextNode; // 政府統計名
  GOV_ORG: EstatTextNode; // 作成機関
  STATISTICS_NAME: string; // 提供統計名
  TITLE: EstatTextNode; // 統計表題
  CYCLE?: string; // 周期
  SURVEY_DATE?: string; // 調査年月
  OPEN_DATE?: string; // 公開日
  SMALL_AREA?: "0" | "1" | "2"; // 小地域
  OVERALL_TOTAL_NUMBER?: number; // 総件数
  UPDATED_DATE?: string; // 更新日
  TITLE_SPEC?: {
    TABLE_CATEGORY?: string;
    TABLE_NAME: string;
    TABLE_EXPLANATION?: string;
  };
  STATISTICS_NAME_SPEC?: {
    TABULATION_CATEGORY: string;
    TABULATION_SUB_CATEGORY1?: string;
    TABULATION_SUB_CATEGORY2?: string;
    TABULATION_SUB_CATEGORY3?: string;
    TABULATION_SUB_CATEGORY4?: string;
    TABULATION_SUB_CATEGORY5?: string;
  };
  MAIN_CATEGORY?: EstatTextNode; // 分野（大分類）
  SUB_CATEGORY?: EstatTextNode; // 分野（小分類）
}

/**
 * 統計表検索オプション
 */
export interface StatsListSearchOptions {
  searchWord?: string;
  statsCode?: string;
  fieldCode?: string;
  collectArea?: "1" | "2" | "3";
  surveyYears?: string;
  openYears?: string;
  limit?: number;
  startPosition?: number;
}

/**
 * 統計表検索結果
 */
export interface StatsListSearchResult {
  totalCount: number;
  tables: StatsListTableInfo[];
  pagination: {
    fromNumber: number;
    toNumber: number;
    nextKey?: number;
  };
}

/**
 * 統計表リスト用のテーブル情報
 */
export interface StatsListTableInfo {
  id: string;
  statName: string;
  govOrg: string;
  statisticsName: string;
  title: string;
  cycle?: string;
  surveyDate?: string;
  openDate?: string;
  smallArea?: "0" | "1" | "2";
  totalNumber?: number;
  updatedDate?: string;
  mainCategory?: {
    code: string;
    name: string;
  };
  subCategory?: {
    code: string;
    name: string;
  };
}

/**
 * ページング処理オプション
 */
export interface PagingOptions {
  maxResults?: number;
  batchSize?: number;
  delayMs?: number;
}
