"use client";

import { useState, useCallback } from "react";
import { List } from "lucide-react";
import {
  StatsListSearchOptions,
  StatsListTableInfo,
  DetailedStatsListTableInfo,
  AdvancedStatsListSearchOptions,
  StatsFieldCode,
} from "@/lib/estat-api/types/stats-list";
import { StatsListSearchTabs } from "@/components/organisms/estat-api/stats-list/StatsListSearchTabs";
import { StatsListResults } from "@/components/organisms/estat-api/stats-list/StatsListResults";
import { StatsTableDetailModal } from "@/components/organisms/estat-api/stats-list/StatsTableDetailModal";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";
import { useStatsListSearch } from "@/hooks/estat-api/useStatsListSearch";

/**
 * 表示モードの型定義
 */
type ViewMode = "list" | "grid";

/**
 * e-Stat統計表一覧ページコンポーネント
 *
 * 機能:
 * - 統合検索タブ（分野別、シンプル、高度検索）
 * - 検索結果の表示（リスト/グリッド表示）
 * - 統計表の詳細表示（モーダル）
 * - お気に入り機能
 * - 検索履歴の表示
 * - ソート・フィルタ機能
 *
 * @returns JSX要素
 */
export function EstatAPIStatsListPage() {
  // ===== 状態管理 =====

  /** 表示モード（リスト/グリッド） */
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  /** 選択された統計表の詳細情報（モーダル表示用） */
  const [selectedTable, setSelectedTable] =
    useState<DetailedStatsListTableInfo | null>(null);

  /** 選択された統計分野コード */
  const [selectedField, setSelectedField] = useState<
    StatsFieldCode | undefined
  >(undefined);

  // ===== カスタムフック =====

  /** 統計表検索関連の状態とメソッド */
  const {
    searchResult, // 検索結果
    isLoading, // ローディング状態
    error, // エラー情報
    searchHistory, // 検索履歴
    favorites, // お気に入り一覧
    search, // 検索実行メソッド
    sort, // ソートメソッド
    filter, // フィルタメソッド
    toggleFavorite, // お気に入り切り替えメソッド
  } = useStatsListSearch();

  // ===== イベントハンドラー =====

  /**
   * シンプル検索の実行
   * @param options - 検索オプション
   */
  const handleSimpleSearch = useCallback(
    async (options: StatsListSearchOptions) => {
      console.log("🔵 Page: シンプル検索開始", options);
      await search(options as AdvancedStatsListSearchOptions);
    },
    [search]
  );

  /**
   * 高度検索の実行
   * @param options - 高度検索オプション
   */
  const handleAdvancedSearch = useCallback(
    async (options: AdvancedStatsListSearchOptions) => {
      console.log("🔵 Page: 高度検索開始", options);
      await search(options);
    },
    [search]
  );

  /**
   * 統計表の選択処理
   * @param table - 選択された統計表情報
   */
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

  /**
   * 統計分野の選択処理
   * @param fieldCode - 選択された統計分野コード
   */
  const handleFieldSelect = useCallback(
    (fieldCode: StatsFieldCode) => {
      console.log("🔵 Page: 分野選択", fieldCode);
      setSelectedField(fieldCode);

      // 選択した分野で検索
      search({
        statsField: fieldCode,
        limit: 100,
      });
    },
    [search]
  );

  /**
   * ソート処理
   * @param sortBy - ソート基準
   * @param order - ソート順序
   */
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

  /**
   * フィルタ処理
   * @param filters - フィルタ条件
   */
  const handleFilter = useCallback(
    (filters: any) => {
      console.log("🔵 Page: フィルタ", filters);
      filter(filters);
    },
    [filter]
  );

  /**
   * お気に入りの切り替え処理
   * @param table - 対象の統計表情報
   */
  const handleToggleFavorite = useCallback(
    (table: StatsListTableInfo) => {
      console.log("🔵 Page: お気に入り切り替え", table);
      toggleFavorite(table);
    },
    [toggleFavorite]
  );

  // ===== レンダリング =====

  return (
    <EstatAPIPageLayout title="e-Stat 統計表一覧" icon={List} useCard={false}>
      <div className="space-y-6">
        {/* 統合検索タブ */}
        <StatsListSearchTabs
          onSimpleSearch={handleSimpleSearch}
          onAdvancedSearch={handleAdvancedSearch}
          onFieldSelect={handleFieldSelect}
          selectedField={selectedField}
          isLoading={isLoading}
          defaultTab="simple"
        />

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

        {/* 検索結果表示 */}
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

        {/* 検索履歴表示 */}
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

        {/* お気に入り表示 */}
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
                  <p className="text-sm text-gray-600 mt-1">{table.statName}</p>
                  <p className="text-xs text-gray-500 mt-1">{table.govOrg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 統計表詳細モーダル */}
      <StatsTableDetailModal
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
      />
    </EstatAPIPageLayout>
  );
}
