import { EstatMetaCategoryData } from "./index";

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
