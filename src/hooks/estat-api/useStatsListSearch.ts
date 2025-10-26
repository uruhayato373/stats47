/**
 * e-Stat統計表リスト検索カスタムフック（useSWR最適化版）
 * 責務: 検索状態管理とビジネスロジック
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import useSWR from "swr";

import {
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
} from "@/features/estat-api/core/types/stats-list";
import {
  EstatStatsListFormatter,
  generateStatsListCacheKey,
  statsListFetcherWithErrorHandling,
} from "@/features/estat-api/stats-list/services";

/**
 * フィルタ条件の型
 */
interface FilterConditions {
  cycleFilter?: string[];
  dateRange?: { from?: string; to?: string };
  organizationFilter?: string[];
}

/**
 * ソート条件の型
 */
interface SortConditions {
  sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName";
  sortOrder: "asc" | "desc";
}

/**
 * 統計表リスト検索フック（useSWR最適化版）
 */
export function useStatsListSearch() {
  // 検索オプション（SWRのキーとして使用）
  const [searchOptions, setSearchOptions] =
    useState<StatsListSearchOptions | null>(null);

  // お気に入り（ローカル状態として維持）
  const [favorites, setFavorites] = useState<StatsListTableInfo[]>([]);

  // フィルタ・ソート状態
  const [filters, setFilters] = useState<FilterConditions>({});
  const [sortConditions, setSortConditions] = useState<SortConditions>({
    sortBy: "surveyDate",
    sortOrder: "desc",
  });

  // 表示モード
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // キャッシュキー生成
  const cacheKey = useMemo(() => {
    return searchOptions ? generateStatsListCacheKey(searchOptions) : null;
  }, [searchOptions]);

  // useSWRでデータ取得
  const {
    data: searchResult,
    error,
    isLoading,
    mutate,
  } = useSWR<StatsListSearchResult>(
    cacheKey,
    statsListFetcherWithErrorHandling,
    {
      revalidateOnFocus: false, // データは頻繁に変わらない
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5分間キャッシュ
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onSuccess: (data) => {
        console.log("✅ useStatsListSearch: データ取得成功", {
          tablesCount: data?.tables.length,
          totalCount: data?.totalCount,
        });
      },
      onError: (error) => {
        console.error("❌ useStatsListSearch: データ取得エラー", error);
      },
    }
  );

  // フィルタ・ソート処理をuseMemoで最適化
  const filteredAndSortedTables = useMemo(() => {
    if (!searchResult?.tables) return [];

    let tables = [...searchResult.tables];

    // フィルタリング
    if (
      filters.cycleFilter ||
      filters.dateRange ||
      filters.organizationFilter
    ) {
      tables = EstatStatsListFormatter.filterResults(tables, {
        cycleFilter: filters.cycleFilter,
        dateRange: filters.dateRange,
      });

      // 機関フィルタ
      if (filters.organizationFilter && filters.organizationFilter.length > 0) {
        tables = tables.filter((table) =>
          filters.organizationFilter!.includes(table.govOrg)
        );
      }
    }

    // ソート
    tables = EstatStatsListFormatter.sortResults(
      tables,
      sortConditions.sortBy,
      sortConditions.sortOrder
    );

    return tables;
  }, [searchResult, filters, sortConditions]);

  // 最終的な検索結果
  const finalSearchResult = useMemo(() => {
    if (!searchResult) return null;

    return {
      ...searchResult,
      tables: filteredAndSortedTables,
    };
  }, [searchResult, filteredAndSortedTables]);

  /**
   * 検索実行（useSWRに移譲）
   */
  const search = useCallback((options: StatsListSearchOptions) => {
    console.log("🔵 Hook: 検索開始", options);
    setSearchOptions(options);
  }, []);

  /**
   * ソート実行（useMemoで自動更新）
   */
  const sort = useCallback(
    (
      sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
      order: "asc" | "desc"
    ) => {
      setSortConditions({ sortBy, sortOrder: order });
    },
    []
  );

  /**
   * フィルタリング実行（useMemoで自動更新）
   */
  const filter = useCallback((newFilters: FilterConditions) => {
    setFilters(newFilters);
  }, []);

  /**
   * お気に入り追加/削除
   */
  const toggleFavorite = useCallback((table: StatsListTableInfo) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((fav) => fav.id === table.id);

      if (isFavorite) {
        return prev.filter((fav) => fav.id !== table.id);
      } else {
        return [...prev, table];
      }
    });
  }, []);

  /**
   * データ再取得（useSWRのmutateを使用）
   */
  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  /**
   * お気に入りクリア
   */
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  /**
   * エラークリア（useSWRのエラーは自動的にクリアされる）
   */
  const clearError = useCallback(() => {
    // useSWRのエラーは自動的にクリアされるため、何もしない
  }, []);

  /**
   * 検索結果クリア
   */
  const clearResults = useCallback(() => {
    setSearchOptions(null);
  }, []);

  /**
   * 統計名リスト取得（useSWRに移譲）
   */
  const fetchStatsNameList = useCallback(
    (options: StatsListSearchOptions = {}) => {
      // statsNameListは別のAPIエンドポイントなので、通常の検索として実行
      search(options);
    },
    [search]
  );

  /**
   * 更新された統計取得（useSWRに移譲）
   */
  const fetchUpdatedStats = useCallback(
    (since: string, options: StatsListSearchOptions = {}) => {
      // updatedDateは別のAPIエンドポイントなので、通常の検索として実行
      search(options);
    },
    [search]
  );

  return {
    // 状態（既存APIとの互換性を保つ）
    searchResult: finalSearchResult,
    isLoading,
    error: error ? error.message : null,
    searchHistory: [], // 簡素化のため空配列
    favorites,
    filters,
    sortConditions,
    viewMode,

    // アクション
    search,
    sort,
    filter,
    toggleFavorite,
    searchFromHistory: search, // 互換性のため
    clearHistory: () => {}, // 簡素化のため
    clearFavorites,
    clearError,
    clearResults,
    fetchStatsNameList,
    fetchUpdatedStats,
    setViewMode,
    refetch, // 新機能
  };
}
