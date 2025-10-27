/**
 * e-Stat API meta-info関連の型定義
 */

import { AreaType } from "@/features/area";
import {
  EstatClassInfo,
  EstatResult,
  EstatTableInfo,
} from "@/features/estat-api/core/types/common";
import { EstatMetaCategoryData } from "@/features/estat-api/stats-data/types";

// ============================================================================
// APIレスポンス型
// ============================================================================

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
 * 保存されたメタデータアイテム
 * ランキング設定で使用される保存済みデータ
 */
export interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
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
  formattedYears: string[];
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
 * e-Stat API CLASS_OBJ の型定義（common.tsのEstatClassObjectのエイリアス）
 * GET_META_INFO完全ガイド 4.3 CLASS_INF に基づく
 */
export type ClassObject =
  import("@/features/estat-api/core/types/common").EstatClassObject;

/**
 * e-Stat API CLASS の型定義（common.tsのEstatClassのエイリアス）
 * GET_META_INFO完全ガイド 4.3 CLASS_INF に基づく
 */
export type ClassItem =
  import("@/features/estat-api/core/types/common").EstatClass;

/**
 * stats-data互換の選択肢型（フラット構造）
 * stats-dataのFormattedValue.dimensionsと同じ構造
 */
export interface DimensionSelectOptions {
  area: SelectOption[];
  time: SelectOption[];
  tab?: SelectOption[];
  cat01?: SelectOption[];
  cat02?: SelectOption[];
  cat03?: SelectOption[];
  cat04?: SelectOption[];
  cat05?: SelectOption[];
  cat06?: SelectOption[];
  cat07?: SelectOption[];
  cat08?: SelectOption[];
  cat09?: SelectOption[];
  cat10?: SelectOption[];
  cat11?: SelectOption[];
  cat12?: SelectOption[];
  cat13?: SelectOption[];
  cat14?: SelectOption[];
  cat15?: SelectOption[];
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

// ============================================================================
// ドメインモデル型
// ============================================================================

/**
 * e-Statメタ情報の型定義
 */
export interface EstatMetaInfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  area_type: AreaType;
  cycle?: string;
  survey_date?: string;
  description?: string;
  last_fetched_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * 自動保存ステータスの型定義
 */
export interface AutoSaveStatus {
  type: "success" | "error" | null;
  message: string;
}
