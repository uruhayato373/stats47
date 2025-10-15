import { EstatMetaCategoryData } from "./index";
import { EstatResult, EstatTableInfo, EstatClassInfo } from "./common";

/**
 * getMetaInfo APIパラメータ
 */
export interface GetMetaInfoParams {
  appId: string; // アプリケーションID
  statsDataId: string; // 統計表ID
  lang?: "J" | "E"; // 言語（デフォルト:J）
}

/**
 * getMetaInfo APIのレスポンス型
 * メタ情報（項目名、コード等）を取得
 */
export interface EstatMetaInfoResponse {
  GET_META_INFO: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: "J" | "E";
      DATA_FORMAT: "X" | "J";
      STATS_DATA_ID: string;
    };
    METADATA_INF: {
      TABLE_INF: EstatTableInfo;
      CLASS_INF: EstatClassInfo;
    };
  };
}

/**
 * 変換されたメタデータエントリ
 */
export interface TransformedMetadataEntry {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string;
  item_name: string | null;
  unit: string | null;
}

/**
 * データベースに保存されたe-Statメタ情報アイテム
 * estat_metainfoテーブルに対応
 */
export interface SavedEstatMetainfoItem {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string | null;
  item_name: string | null;
  unit: string | null;
  ranking_key: string | null;
  updated_at: string;
  created_at: string;
}

/**
 * メタデータサマリー情報
 */
export interface MetadataSummary {
  totalEntries: number;
  uniqueStats: number;
  categories: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  lastUpdated: string | null;
}

/**
 * 検索結果
 */
export interface MetadataSearchResult {
  entries: EstatMetaCategoryData[];
  totalCount: number;
  searchQuery: string;
  executedAt: string;
}

/**
 * 統計表の基本情報
 * GET_META_INFO完全ガイド 4.2 TABLE_INF に基づく
 */
export interface TableInfo {
  id: string;
  statName: string;
  organization: string;
  statisticsName: string;
  title: string;
  cycle: string;
  surveyDate: string;
  openDate: string;
  smallArea: string;
  collectArea: string;
  mainCategory: {
    code: string;
    name: string;
  };
  subCategory?: {
    code: string;
    name: string;
  };
  totalRecords: number;
  updatedDate: string;
  explanation?: string;
}

/**
 * 分類項目情報
 * GET_META_INFO完全ガイド 4.3 CLASS_INF に基づく
 */
export interface CategoryInfo {
  id: string;
  name: string;
  items: Array<{
    code: string;
    name: string;
    unit?: string;
    level?: string;
    parentCode?: string;
  }>;
}

/**
 * 都道府県情報
 */
export interface PrefectureInfo {
  code: string;
  name: string;
  level: number;
  parentCode?: string;
  unit?: string;
}

/**
 * 時間軸情報
 * GET_META_INFO完全ガイド 6.4 に基づく
 */
export interface TimeAxisInfo {
  availableYears: string[];
  minYear: string;
  maxYear: string;
}

/**
 * UI用の選択肢
 * GET_META_INFO完全ガイド 7.2 に基づく
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 完全解析済みメタ情報
 * GET_META_INFO完全ガイド 6.5 に基づく
 */
export interface ParsedMetaInfo {
  tableInfo: TableInfo;
  dimensions: {
    categories: CategoryInfo[];
    areas: PrefectureInfo[];
    timeAxis: TimeAxisInfo;
  };
}

/**
 * 都道府県コード・名称マップ
 * GET_META_INFO完全ガイド 6.2 に基づく
 */
export type PrefectureMap = Map<string, string>;
