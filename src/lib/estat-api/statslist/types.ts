/**
 * e-Stat統計表リスト共通型定義
 */

import { GetStatsListParams } from "../types";

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
  tables: FormattedTableInfo[];
  pagination: {
    fromNumber: number;
    toNumber: number;
    nextKey?: number;
  };
}

/**
 * 整形された統計表情報
 */
export interface FormattedTableInfo {
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
