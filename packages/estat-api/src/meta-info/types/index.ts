import type { AreaType } from "@stats47/types";

/**
 * e-Stat API メタ情報レスポンスの型定義
 */

/** テキストノード（$: 値, @属性: 属性値） */
export interface EstatTextNode {
  $: string;
  "@no"?: string;
  "@code"?: string;
}

/** 分類項目 */
export interface ClassItem {
  "@code": string;
  "@name": string;
  "@unit"?: string;
  "@level"?: string;
  "@parentCode"?: string;
}

/** 分類オブジェクト */
export interface ClassObject {
  "@id": string;
  "@name": string;
  CLASS: ClassItem | ClassItem[];
}

/** 統計表情報 */
export interface EstatTableInf {
  "@id": string;
  STAT_NAME?: EstatTextNode;
  GOV_ORG?: EstatTextNode;
  STATISTICS_NAME?: string;
  TITLE?: EstatTextNode;
  CYCLE?: string;
  SURVEY_DATE?: string;
  OPEN_DATE?: string;
  SMALL_AREA?: string;
  COLLECT_AREA?: string;
  MAIN_CATEGORY?: EstatTextNode;
  SUB_CATEGORY?: EstatTextNode;
  OVERALL_TOTAL_NUMBER?: string | number;
  UPDATED_DATE?: string;
  STATISTICS_NAME_SPEC?: {
    TABULATION_CATEGORY?: string;
  };
}

/** 分類情報 */
export interface EstatClassInf {
  CLASS_OBJ: ClassObject[];
}

/** メタデータ情報 */
export interface EstatMetadataInf {
  TABLE_INF: EstatTableInf;
  CLASS_INF: EstatClassInf;
}

/** APIレスポンス結果 */
export interface EstatResult {
  STATUS: number;
  ERROR_MSG?: string;
  DATE?: string;
}

/**
 * e-Stat API メタ情報レスポンス
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
 */
export interface EstatMetaInfoResponse {
  GET_META_INFO: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: string;
      STATS_DATA_ID: string;
      DATA_FORMAT: string;
    };
    METADATA_INF: EstatMetadataInf;
  };
}

export interface AreaInfo {
  code: string;
  name: string;
  level: number;
  parentCode?: string;
  unit?: string;
}

export interface CategoryItem {
  code: string;
  name: string;
  unit?: string;
  level?: string;
  parentCode?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  items: CategoryItem[];
}

export interface ParsedMetaInfo {
  tableInfo: TableInfo;
  dimensions: {
    categories: CategoryInfo[];
    areas: AreaInfo[];
    timeAxis: TimeAxisInfo;
  };
}

export interface TableInfo {
  id: string;
  statName: string;
  title: string;
  organization: string;
  statisticsName: string;
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
  tabulationCategory: string;
  explanation?: string;
}

export interface TimeAxisInfo {
  availableYears: string[];
  formattedYears: string[];
  minYear: string;
  maxYear: string;
}

export interface MetaInfoCacheDataR2 {
  statsDataId: string;
  metaInfoResponse: EstatMetaInfoResponse;
  updatedAt: string;
  savedAt?: string;
  summary?: any;
  version?: string;
}



// 既存のリポジトリ等で使われる型
export interface SavedEstatMetaInfo {
  statsDataId: string;
  statName: string;
  title: string;
  areaType: AreaType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string | null;
  categoryFilters?: string | null;
  itemNamePrefix?: string | null;
  memo?: string | null;
}

export interface EstatMetaInfoListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface SaveEstatMetaInfoInput {
  statsDataId: string;
  statName: string;
  title: string;
  areaType: AreaType;
  description?: string | null;
  itemNamePrefix?: string | null;
  memo?: string | null;
  categoryFilters?: string | null;
}
export interface EstatMetaDefinition {
  statName: string;
  title: string;
  areaType: AreaType;
  description: string;
}
