"use client";

import { useState, useCallback } from "react";
import {
  EstatStatsListFetcher,
  EstatStatsListFormatter,
} from "@/lib/estat-api";
import {
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
  DetailedStatsListTableInfo,
  AdvancedStatsListSearchOptions,
  StatsFieldCode,
} from "@/lib/estat-api/types/stats-list";
import { StatsListSearch } from "./StatsListSearch";
import { AdvancedStatsListSearch } from "./AdvancedStatsListSearch";
import { StatsListResults } from "./StatsListResults";
import { StatsTableDetailModal } from "./StatsTableDetailModal";
import { StatsFieldNavigation } from "./StatsFieldNavigation";
import { useStatsListSearch } from "@/hooks/estat-api/useStatsListSearch";

interface EstatAPIStatsListPageProps {
  initialData?: StatsListSearchResult;
}

type SearchMode = "simple" | "advanced";
type ViewMode = "list" | "grid";

export function EstatAPIStatsListPage({
  initialData,
}: EstatAPIStatsListPageProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>("simple");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTable, setSelectedTable] =
    useState<DetailedStatsListTableInfo | null>(null);
  const [selectedField, setSelectedField] = useState<
    StatsFieldCode | undefined
  >(undefined);
  const [showFieldNavigation, setShowFieldNavigation] = useState(false);

  const {
    searchResult,
    isLoading,
    error,
    searchHistory,
    favorites,
    search,
    sort,
    filter,
    toggleFavorite,
  } = useStatsListSearch();

  const handleSimpleSearch = useCallback(
    async (options: StatsListSearchOptions) => {
      console.log("🔵 Page: シンプル検索開始", options);
      await search(options as AdvancedStatsListSearchOptions);
    },
    [search]
  );

  const handleAdvancedSearch = useCallback(
    async (options: AdvancedStatsListSearchOptions) => {
      console.log("🔵 Page: 高度検索開始", options);
      await search(options);
    },
    [search]
  );

  const handleTableSelect = useCallback((table: StatsListTableInfo) => {
    console.log("🔵 Page: テーブル選択", table);
    // 詳細情報を取得してモーダル表示
    const detailedTable: DetailedStatsListTableInfo = {
      ...table,
      collectArea: undefined,
      description: undefined,
      statisticsNameSpec: undefined,
    };
    setSelectedTable(detailedTable);
  }, []);

  const handleFieldSelect = useCallback(
    (fieldCode: StatsFieldCode) => {
      console.log("🔵 Page: 分野選択", fieldCode);
      setSelectedField(fieldCode);
      setShowFieldNavigation(false);

      // 選択した分野で検索
      search({
        statsField: fieldCode,
        limit: 100,
      });
    },
    [search]
  );

  const handleSort = useCallback(
    (
      sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
      order: "asc" | "desc"
    ) => {
      console.log("🔵 Page: ソート", { sortBy, order });
      sort(sortBy, order);
    },
    [sort]
  );

  const handleFilter = useCallback(
    (filters: any) => {
      console.log("🔵 Page: フィルタ", filters);
      filter(filters);
    },
    [filter]
  );

  const handleToggleFavorite = useCallback(
    (table: StatsListTableInfo) => {
      console.log("🔵 Page: お気に入り切り替え", table);
      toggleFavorite(table);
    },
    [toggleFavorite]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">統計表一覧</h1>
              <p className="mt-2 text-gray-600">
                e-Stat APIから統計表の一覧を検索・閲覧できます
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFieldNavigation(!showFieldNavigation)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                分野別検索
              </button>

              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setSearchMode("simple")}
                  className={`px-4 py-2 text-sm ${
                    searchMode === "simple"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  シンプル検索
                </button>
                <button
                  onClick={() => setSearchMode("advanced")}
                  className={`px-4 py-2 text-sm ${
                    searchMode === "advanced"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  高度検索
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 分野別ナビゲーション */}
        {showFieldNavigation && (
          <div className="mb-6">
            <StatsFieldNavigation
              onSelectField={handleFieldSelect}
              selectedField={selectedField}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* 検索フォーム */}
          {searchMode === "simple" ? (
            <StatsListSearch
              onSearch={handleSimpleSearch}
              isLoading={isLoading}
            />
          ) : (
            <AdvancedStatsListSearch
              onSearch={handleAdvancedSearch}
              isLoading={isLoading}
            />
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    エラーが発生しました
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 検索結果 */}
          {searchResult && (
            <StatsListResults
              tables={searchResult.tables}
              totalCount={searchResult.totalCount}
              isLoading={isLoading}
              onTableSelect={handleTableSelect}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSort={handleSort}
              onFilter={handleFilter}
              sortBy="surveyDate"
              sortOrder="desc"
            />
          )}

          {/* 検索履歴 */}
          {searchHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                検索履歴
              </h3>
              <div className="space-y-2">
                {searchHistory.slice(0, 5).map((history, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {history.searchWord && `キーワード: ${history.searchWord}`}
                    {history.statsField && ` | 分野: ${history.statsField}`}
                    {history.collectArea && ` | 地域: ${history.collectArea}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* お気に入り */}
          {favorites.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                お気に入り ({favorites.length}件)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.slice(0, 6).map((table) => (
                  <div
                    key={table.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
                    onClick={() => handleTableSelect(table)}
                  >
                    <h4 className="font-medium text-gray-900 truncate">
                      {table.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {table.statName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{table.govOrg}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* テーブル詳細モーダル */}
        <StatsTableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      </div>
    </div>
  );
}
