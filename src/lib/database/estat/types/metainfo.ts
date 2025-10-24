/**
 * e-Stat メタ情報の型定義
 * 統計表レベル（stats_data_id）での管理に特化
 */

import type { AreaType } from "@/features/area";

export interface EstatMetaInfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  area_type: AreaType; // 'country' | 'prefecture' | 'municipality'
  cycle?: string;
  survey_date?: string;
  description?: string;
  last_fetched_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveEstatMetaInfoInput {
  stats_data_id: string;
  stat_name: string;
  title: string;
  area_type: AreaType;
  cycle?: string;
  survey_date?: string;
  description?: string;
}

export interface EstatMetaInfoSearchResult {
  items: EstatMetaInfo[];
  totalCount: number;
  searchQuery?: string;
  executedAt: string;
}

export interface EstatMetaInfoSummary {
  totalEntries: number;
  lastUpdated: string | null;
}

export interface EstatMetaInfoListOptions {
  limit?: number;
  offset?: number;
  orderBy?: "updated_at" | "stat_name" | "title";
  orderDirection?: "ASC" | "DESC";
}

export interface EstatMetaInfoSearchOptions {
  limit?: number;
  offset?: number;
  searchType?: "full" | "stat_name" | "title" | "description";
}
