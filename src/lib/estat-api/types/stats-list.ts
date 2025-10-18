/**
 * e-Stat統計表リスト共通型定義
 */

import { EstatResult, EstatTextNode } from "./common";

/**
 * 統計分野コード
 */
export type StatsFieldCode =
  | "01" // 国土・気象
  | "02" // 人口・世帯
  | "03" // 労働・賃金
  | "04" // 事業所
  | "05" // 農林水産業
  | "06" // 鉱工業
  | "07" // 商業・サービス業
  | "08" // 企業・家計・経済
  | "09" // 住宅・土地・建設
  | "10" // エネルギー・水
  | "11" // 運輸・観光
  | "12" // 情報通信・科学技術
  | "13" // 教育・文化・スポーツ・生活
  | "14" // 行財政
  | "15" // 司法・安全・環境
  | "16" // 社会保障・衛生
  | "17"; // 国際

/**
 * 統計分野コード情報マップ
 */
export const STATS_FIELDS = {
  "01": { name: "国土・気象", icon: "🌍" },
  "02": { name: "人口・世帯", icon: "👥" },
  "03": { name: "労働・賃金", icon: "💼" },
  "04": { name: "事業所", icon: "🏢" },
  "05": { name: "農林水産業", icon: "🌾" },
  "06": { name: "鉱工業", icon: "🏭" },
  "07": { name: "商業・サービス業", icon: "🛍️" },
  "08": { name: "企業・家計・経済", icon: "💰" },
  "09": { name: "住宅・土地・建設", icon: "🏠" },
  "10": { name: "エネルギー・水", icon: "⚡" },
  "11": { name: "運輸・観光", icon: "🚗" },
  "12": { name: "情報通信・科学技術", icon: "💻" },
  "13": { name: "教育・文化・スポーツ・生活", icon: "🎓" },
  "14": { name: "行財政", icon: "🏛️" },
  "15": { name: "司法・安全・環境", icon: "⚖️" },
  "16": { name: "社会保障・衛生", icon: "🏥" },
  "17": { name: "国際", icon: "🌐" },
} as const;

/**
 * getStatsList APIパラメータ
 */
export interface GetStatsListParams {
  appId: string; // アプリケーションID

  // 検索条件パラメータ
  searchKind?: "1" | "2"; // 1: AND検索, 2: OR検索
  surveyYears?: string; // YYYYMM形式、範囲指定可能
  openYears?: string; // YYYYMM形式、範囲指定可能
  statsField?: string; // 統計分野（2桁コード）※fieldから変更
  statsCode?: string; // 政府統計コード（8桁または5桁）
  searchWord?: string; // 検索キーワード（スペース区切りで複数指定可）

  // フィルタリングパラメータ
  collectArea?: "1" | "2" | "3"; // 1: 全国, 2: 都道府県, 3: 市区町村
  explanationGetFlg?: "Y" | "N"; // 解説情報取得有無
  statsNameList?: "Y" | "N"; // 統計名リスト表示

  // ページング・取得件数制御
  startPosition?: number; // 取得開始位置（デフォルト: 1）
  limit?: number; // 取得件数（デフォルト: 100、最大: 10000）
  updatedDate?: string; // 更新日付（YYYY-MM-DD形式）

  // 出力オプション
  lang?: "J" | "E"; // 言語設定
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
        NEXT_KEY?: number; // 追加: 次ページの開始位置
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
  statsField?: string; // fieldCodeから変更
  collectArea?: "1" | "2" | "3";
  surveyYears?: string;
  openYears?: string;
  updatedDate?: string; // 追加
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
 * 詳細な統計表情報（解説情報を含む）
 */
export interface DetailedStatsListTableInfo extends StatsListTableInfo {
  collectArea?: "1" | "2" | "3"; // 集計地域区分
  description?: string; // 解説（explanationGetFlg=Y時）
  statisticsNameSpec?: {
    // 統計名称詳細
    tabulationCategory: string;
    tabulationSubCategory1?: string;
    tabulationSubCategory2?: string;
    tabulationSubCategory3?: string;
    tabulationSubCategory4?: string;
    tabulationSubCategory5?: string;
  };
}

/**
 * 高度な統計表検索オプション
 */
export interface AdvancedStatsListSearchOptions extends StatsListSearchOptions {
  // 検索種別
  searchKind?: "1" | "2"; // AND/OR検索

  // 解説情報
  includeExplanation?: boolean; // 解説情報を含めるか

  // フィルタリング
  cycleFilter?: string[]; // 周期フィルタ（年次、月次など）
  dateRangeFilter?: {
    from?: string;
    to?: string;
  };

  // ソート
  sortBy?: "surveyDate" | "openDate" | "updatedDate" | "statName";
  sortOrder?: "asc" | "desc";
}

/**
 * ページング処理オプション
 */
export interface PagingOptions {
  maxResults?: number;
  batchSize?: number;
  delayMs?: number;
}
