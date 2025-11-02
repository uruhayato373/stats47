"use client";

import { useCallback, useMemo, useState } from "react";

import useSWR from "swr";

import {
  EstatStatsListFormatter,
  generateStatsListCacheKey,
  statsListFetcherWithErrorHandling,
} from "@/features/estat-api/stats-list/services";
import {
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
} from "@/features/estat-api/stats-list/types";

/**
 * フィルタ条件
 */
interface FilterConditions {
  /** 周期フィルタ（周期コードの配列） */
  cycleFilter?: string[];
  /** 日付範囲フィルタ */
  dateRange?: { from?: string; to?: string };
  /** 作成機関フィルタ（機関名の配列） */
  organizationFilter?: string[];
}

/**
 * ソート条件
 */
interface SortConditions {
  /** ソート項目 */
  sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName";
  /** ソート順 */
  sortOrder: "asc" | "desc";
}

/**
 * useStatsListSearchフックの戻り値
 */
export interface UseStatsListSearchReturn {
  /** 検索結果（フィルタ・ソート適用済み） */
  searchResult: StatsListSearchResult | null;
  /** 読み込み中かどうか */
  isLoading: boolean;
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null;
  /** 検索履歴（簡素化のため空配列） */
  searchHistory: StatsListSearchOptions[];
  /** お気に入りの統計表一覧 */
  favorites: StatsListTableInfo[];
  /** 現在のフィルタ条件 */
  filters: FilterConditions;
  /** 現在のソート条件 */
  sortConditions: SortConditions;
  /** 表示モード */
  viewMode: "list" | "grid";
  /** 検索を実行する関数 */
  search: (options: StatsListSearchOptions) => void;
  /** ソートを実行する関数 */
  sort: (
    sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
    order: "asc" | "desc"
  ) => void;
  /** フィルタを適用する関数 */
  filter: (newFilters: FilterConditions) => void;
  /** お気に入りを切り替える関数 */
  toggleFavorite: (table: StatsListTableInfo) => void;
  /** 検索履歴から検索を実行する関数（互換性のため） */
  searchFromHistory: (options: StatsListSearchOptions) => void;
  /** 検索履歴をクリアする関数（簡素化のため空関数） */
  clearHistory: () => void;
  /** お気に入りをクリアする関数 */
  clearFavorites: () => void;
  /** エラーをクリアする関数（useSWRのエラーは自動的にクリアされる） */
  clearError: () => void;
  /** 検索結果をクリアする関数 */
  clearResults: () => void;
  /** 統計名リストを取得する関数 */
  fetchStatsNameList: (options?: StatsListSearchOptions) => void;
  /** 更新された統計を取得する関数 */
  fetchUpdatedStats: (since: string, options?: StatsListSearchOptions) => void;
  /** 表示モードを設定する関数 */
  setViewMode: (mode: "list" | "grid") => void;
  /** データを再取得する関数 */
  refetch: () => void;
}

/**
 * e-Stat統計表リスト検索カスタムフック（useSWR最適化版）
 *
 * @remarks
 * - useSWRを使用したデータフェッチとキャッシュ管理
 * - フィルタ・ソート処理をuseMemoで最適化
 * - お気に入り機能（ローカル状態）
 * - 検索結果の自動キャッシュ（5分間）
 * - エラーハンドリングとリトライ機能
 *
 * @returns 検索結果と操作関数
 *
 * @example
 * ```tsx
 * const {
 *   searchResult,
 *   isLoading,
 *   error,
 *   search,
 *   sort,
 *   filter,
 *   toggleFavorite,
 * } = useStatsListSearch();
 *
 * // 検索実行
 * search({ searchWord: "人口", limit: 100 });
 *
 * // ソート実行
 * sort("surveyDate", "desc");
 *
 * // フィルタ適用
 * filter({ cycleFilter: ["年次"], organizationFilter: ["総務省"] });
 * ```
 */
export function useStatsListSearch(): UseStatsListSearchReturn {
  const [searchOptions, setSearchOptions] =
    useState<StatsListSearchOptions | null>(null);

  const [favorites, setFavorites] = useState<StatsListTableInfo[]>([]);

  const [filters, setFilters] = useState<FilterConditions>({});
  const [sortConditions, setSortConditions] = useState<SortConditions>({
    sortBy: "surveyDate",
    sortOrder: "desc",
  });

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const cacheKey = useMemo(() => {
    return searchOptions ? generateStatsListCacheKey(searchOptions) : null;
  }, [searchOptions]);

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

  const finalSearchResult = useMemo(() => {
    if (!searchResult) return null;

    return {
      ...searchResult,
      tables: filteredAndSortedTables,
    };
  }, [searchResult, filteredAndSortedTables]);

  const search = useCallback((options: StatsListSearchOptions) => {
    console.log("🔵 Hook: 検索開始", options);
    console.log("🔵 Hook: 検索オプション詳細", {
      hasSearchWord: !!options.searchWord,
      hasStatsCode: !!options.statsCode,
      hasStatsField: !!options.statsField,
      statsField: options.statsField,
      hasCollectArea: !!options.collectArea,
      limit: options.limit,
      allKeys: Object.keys(options),
    });
    setSearchOptions(options);
  }, []);

  const sort = useCallback(
    (
      sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
      order: "asc" | "desc"
    ) => {
      setSortConditions({ sortBy, sortOrder: order });
    },
    []
  );

  const filter = useCallback((newFilters: FilterConditions) => {
    setFilters(newFilters);
  }, []);

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

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const clearError = useCallback(() => {
    // useSWRのエラーは自動的にクリアされるため、何もしない
  }, []);

  const clearResults = useCallback(() => {
    setSearchOptions(null);
  }, []);

  const fetchStatsNameList = useCallback(
    (options: StatsListSearchOptions = {}) => {
      search(options);
    },
    [search]
  );

  const fetchUpdatedStats = useCallback(
    (since: string, options: StatsListSearchOptions = {}) => {
      search(options);
    },
    [search]
  );

  return {
    searchResult: finalSearchResult,
    isLoading,
    error: error ? error.message : null,
    searchHistory: [],
    favorites,
    filters,
    sortConditions,
    viewMode,
    search,
    sort,
    filter,
    toggleFavorite,
    searchFromHistory: search,
    clearHistory: () => {},
    clearFavorites,
    clearError,
    clearResults,
    fetchStatsNameList,
    fetchUpdatedStats,
    setViewMode,
    refetch,
  };
}
