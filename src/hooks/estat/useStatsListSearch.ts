/**
 * e-Stat統計表リスト検索カスタムフック
 * 責務: 検索状態管理とビジネスロジック
 */

"use client";

import { useState, useCallback, useRef } from "react";
import {
  EstatStatsListFetcher,
  EstatStatsListFormatter,
} from "@/lib/estat-api/stats-list";
import {
  StatsListSearchResult,
  StatsListTableInfo,
  AdvancedStatsListSearchOptions,
} from "@/lib/estat-api/types/stats-list";

/**
 * 検索履歴の型
 */
interface SearchHistoryItem {
  id: string;
  options: AdvancedStatsListSearchOptions;
  timestamp: number;
  resultCount: number;
}

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
 * 統計表リスト検索フック
 */
export function useStatsListSearch() {
  // 基本状態
  const [searchResult, setSearchResult] =
    useState<StatsListSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索履歴
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // お気に入り
  const [favorites, setFavorites] = useState<StatsListTableInfo[]>([]);

  // フィルタ・ソート状態
  const [filters, setFilters] = useState<FilterConditions>({});
  const [sortConditions, setSortConditions] = useState<SortConditions>({
    sortBy: "surveyDate",
    sortOrder: "desc",
  });

  // 表示モード
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // リトライ用のリファレンス
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  /**
   * 検索実行
   */
  const search = useCallback(
    async (options: AdvancedStatsListSearchOptions) => {
      setIsLoading(true);
      setError(null);
      setSearchResult(null);
      retryCountRef.current = 0;

      try {
        console.log("🔵 Hook: 検索開始", options);

        // 高度な検索を実行
        const response = await EstatStatsListFetcher.advancedSearch(options);

        // 結果をフォーマット
        const formattedResult =
          EstatStatsListFormatter.formatStatsListData(response);

        // フィルタリングとソートを適用
        let processedTables = formattedResult.tables;

        // フィルタリング
        if (
          filters.cycleFilter ||
          filters.dateRange ||
          filters.organizationFilter
        ) {
          processedTables = EstatStatsListFormatter.filterResults(
            processedTables,
            {
              cycleFilter: filters.cycleFilter,
              dateRange: filters.dateRange,
            }
          );

          // 機関フィルタ
          if (
            filters.organizationFilter &&
            filters.organizationFilter.length > 0
          ) {
            processedTables = processedTables.filter((table) =>
              filters.organizationFilter!.includes(table.govOrg)
            );
          }
        }

        // ソート
        processedTables = EstatStatsListFormatter.sortResults(
          processedTables,
          sortConditions.sortBy,
          sortConditions.sortOrder
        );

        const finalResult: StatsListSearchResult = {
          ...formattedResult,
          tables: processedTables,
        };

        setSearchResult(finalResult);

        // 検索履歴に追加
        const historyItem: SearchHistoryItem = {
          id: Date.now().toString(),
          options,
          timestamp: Date.now(),
          resultCount: processedTables.length,
        };

        setSearchHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // 最新10件まで保持

        console.log("✅ Hook: 検索完了", finalResult);
      } catch (err) {
        console.error("❌ Hook: 検索エラー", err);

        // リトライ処理
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(
            `🔄 Hook: リトライ ${retryCountRef.current}/${maxRetries}`
          );

          // 指数バックオフで待機
          const waitTime = Math.pow(2, retryCountRef.current - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // 再帰的に検索を実行
          return search(options);
        }

        setError(err instanceof Error ? err.message : "検索に失敗しました");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, sortConditions]
  );

  /**
   * ソート実行
   */
  const sort = useCallback(
    (
      sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
      order: "asc" | "desc"
    ) => {
      setSortConditions({ sortBy, sortOrder: order });

      if (searchResult) {
        const sortedTables = EstatStatsListFormatter.sortResults(
          searchResult.tables,
          sortBy,
          order
        );

        setSearchResult({
          ...searchResult,
          tables: sortedTables,
        });
      }
    },
    [searchResult]
  );

  /**
   * フィルタリング実行
   */
  const filter = useCallback(
    (newFilters: FilterConditions) => {
      setFilters(newFilters);

      if (searchResult) {
        let filteredTables = searchResult.tables;

        // 周期フィルタ
        if (newFilters.cycleFilter && newFilters.cycleFilter.length > 0) {
          filteredTables = EstatStatsListFormatter.filterResults(
            filteredTables,
            {
              cycleFilter: newFilters.cycleFilter,
              dateRange: newFilters.dateRange,
            }
          );
        }

        // 機関フィルタ
        if (
          newFilters.organizationFilter &&
          newFilters.organizationFilter.length > 0
        ) {
          filteredTables = filteredTables.filter((table) =>
            newFilters.organizationFilter!.includes(table.govOrg)
          );
        }

        setSearchResult({
          ...searchResult,
          tables: filteredTables,
        });
      }
    },
    [searchResult]
  );

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
   * 検索履歴から再検索
   */
  const searchFromHistory = useCallback(
    (historyItem: SearchHistoryItem) => {
      search(historyItem.options);
    },
    [search]
  );

  /**
   * 検索履歴クリア
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  /**
   * お気に入りクリア
   */
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  /**
   * エラークリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 検索結果クリア
   */
  const clearResults = useCallback(() => {
    setSearchResult(null);
    setError(null);
  }, []);

  /**
   * 統計名リスト取得
   */
  const fetchStatsNameList = useCallback(
    async (options: AdvancedStatsListSearchOptions = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await EstatStatsListFetcher.fetchStatsNameList(
          options
        );
        const formattedResult =
          EstatStatsListFormatter.formatStatsListData(response);
        setSearchResult(formattedResult);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "統計名リストの取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 更新された統計取得
   */
  const fetchUpdatedStats = useCallback(
    async (since: string, options: AdvancedStatsListSearchOptions = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await EstatStatsListFetcher.fetchUpdatedStats(
          since,
          options
        );
        const formattedResult =
          EstatStatsListFormatter.formatStatsListData(response);
        setSearchResult(formattedResult);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "更新された統計の取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // 状態
    searchResult,
    isLoading,
    error,
    searchHistory,
    favorites,
    filters,
    sortConditions,
    viewMode,

    // アクション
    search,
    sort,
    filter,
    toggleFavorite,
    searchFromHistory,
    clearHistory,
    clearFavorites,
    clearError,
    clearResults,
    fetchStatsNameList,
    fetchUpdatedStats,
    setViewMode,
  };
}
