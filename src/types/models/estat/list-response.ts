import { EstatResult, EstatTextNode } from './raw-response';

/**
 * getStatsList APIのレスポンス型
 * 統計表の検索
 */
export interface EstatStatsListResponse {
  GET_STATS_LIST: {
    RESULT: EstatResult;
    PARAMETER: EstatStatsListParameter;
    DATALIST_INF: {
      NUMBER: number;           // 統計表数
      RESULT_INF?: {           // LIMIT指定時
        FROM_NUMBER: number;
        TO_NUMBER: number;
      };
      LIST_INF?: {             // 統計表リスト（0件の場合は存在しない）
        TABLE_INF?: EstatTableListItem | EstatTableListItem[];
      };
    };
  };
}

/**
 * getStatsList パラメータ
 */
export interface EstatStatsListParameter {
  LANG: 'J' | 'E';
  DATA_FORMAT: 'X' | 'J';
  SEARCH_KIND: '1' | '2' | '3';    // 検索種別
  REPLACE_SP_CHARS: '0' | '1' | '2';
  // 検索条件
  SURVEY_YEARS?: string;            // 調査年月
  OPEN_YEARS?: string;              // 公開年月
  UPDATED_DATE?: string;            // 更新日付
  STATS_CODE?: string;              // 政府統計コード
  SEARCH_WORD?: string;             // キーワード
  STATS_NAME?: string;              // 政府統計名
  GOV_ORG?: string;                // 作成機関
  STATS_NAME_LIST?: string;         // 提供統計名
  TITLE?: string;                   // 統計表題
  EXPLANATION?: string;             // 統計表の説明
  FIELD?: string;                   // 分野
  LAYOUT?: string;                  // 統計大分類
  TOUKEI?: string;                 // 統計小分類
  // ページング
  START_POSITION?: number;
  LIMIT?: number;
}

/**
 * 統計表リスト項目
 */
export interface EstatTableListItem {
  '@id': string;                         // 統計表ID
  STAT_NAME: EstatTextNode;             // 政府統計名
  GOV_ORG: EstatTextNode;               // 作成機関
  STATISTICS_NAME: string;              // 提供統計名
  TITLE: EstatTextNode;                 // 統計表題
  CYCLE?: string;                       // 周期
  SURVEY_DATE?: string;                 // 調査年月
  OPEN_DATE?: string;                   // 公開日
  SMALL_AREA?: '0' | '1' | '2';        // 小地域
  OVERALL_TOTAL_NUMBER?: number;        // 総件数
  UPDATED_DATE?: string;                // 更新日
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
  MAIN_CATEGORY?: EstatTextNode;        // 分野（大分類）
  SUB_CATEGORY?: EstatTextNode;         // 分野（小分類）
}