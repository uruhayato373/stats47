"use client";

import { useCallback, useState } from "react";

import { List } from "lucide-react";

import {
  StatsListResults,
  StatsListSearch,
  StatsTableDetailModal,
} from "@/features/estat-api/stats-list/components";
import { useStatsListSearch } from "@/features/estat-api/stats-list/hooks/useStatsListSearch";
import {
  DetailedStatsListTableInfo,
  StatsListSearchOptions,
  StatsListTableInfo,
} from "@/features/estat-api/stats-list/types";

/**
 * StatsListPageClient - e-Stat統計表一覧ページのクライアントコンポーネント
 *
 * 責務:
 * - 統計表検索機能の提供
 * - 検索結果の表示
 * - 統計表の詳細表示（モーダル）
 * - ソート・フィルタ機能
 *
 * 注: 将来的にサーバーサイドでデータ取得する場合は、propsを追加する
 */
export default function StatsListPageClient() {
  // ===== 状態管理 =====

  /** 選択された統計表の詳細情報（モーダル表示用） */
  const [selectedTable, setSelectedTable] =
    useState<DetailedStatsListTableInfo | null>(null);

  // ===== カスタムフック =====

  /** 統計表検索関連の状態とメソッド */
  const {
    searchResult, // 検索結果
    isLoading, // ローディング状態
    error, // エラー情報
    search, // 検索実行メソッド
    sort, // ソートメソッド
    filter, // フィルタメソッド
  } = useStatsListSearch();

  // ===== イベントハンドラー =====

  /**
   * シンプル検索の実行
   * @param options - 検索オプション
   */
  const handleSimpleSearch = useCallback(
    async (options: StatsListSearchOptions) => {
      console.log("🔵 Page: シンプル検索開始", options);
      console.log("🔵 Page: 検索オプション詳細", {
        hasSearchWord: !!options.searchWord,
        hasStatsCode: !!options.statsCode,
        hasStatsField: !!options.statsField,
        statsField: options.statsField,
        hasCollectArea: !!options.collectArea,
        limit: options.limit,
      });
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
    (filters: Record<string, unknown>) => {
      console.log("🔵 Page: フィルタ", filters);
      filter(filters);
    },
    [filter]
  );

  // ===== レンダリング =====

  return (
    <div className="h-full p-4">
      {/* ヘッダー */}
      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="font-medium text-lg text-foreground flex items-center gap-2">
          <List className="w-6 h-6 text-primary" />
          e-Stat 統計表一覧
        </h1>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-6">
        {/* シンプル検索フォーム */}
        <StatsListSearch onSearch={handleSimpleSearch} isLoading={isLoading} />

        {/* エラー表示 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-destructive/80">
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
            onSort={handleSort}
            onFilter={handleFilter}
            sortBy="surveyDate"
            sortOrder="desc"
          />
        )}

        {/* デバッグ情報 */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs">
            <h4 className="font-bold mb-2">デバッグ情報</h4>
            <div className="space-y-1">
              <p>searchResult: {searchResult ? "存在" : "null"}</p>
              <p>
                searchResult.tables.length:{" "}
                {searchResult?.tables?.length ?? "N/A"}
              </p>
              <p>
                searchResult.tables存在:{" "}
                {searchResult?.tables ? "はい" : "いいえ"}
              </p>
              <p>
                searchResult.tables型:{" "}
                {searchResult?.tables
                  ? Array.isArray(searchResult.tables)
                    ? "配列"
                    : typeof searchResult.tables
                  : "N/A"}
              </p>
              <p>totalCount: {searchResult?.totalCount ?? "N/A"}</p>
              <p>isLoading: {isLoading ? "true" : "false"}</p>
              <p>error: {error || "なし"}</p>
              {searchResult && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">
                    searchResult詳細
                  </summary>
                  <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(
                      {
                        totalCount: searchResult.totalCount,
                        tablesLength: searchResult.tables?.length,
                        tablesType: Array.isArray(searchResult.tables)
                          ? "array"
                          : typeof searchResult.tables,
                        pagination: searchResult.pagination,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* 統計表詳細モーダル */}
        <StatsTableDetailModal
          table={selectedTable}
          isOpen={selectedTable !== null}
          onClose={() => setSelectedTable(null)}
        />
      </div>
    </div>
  );
}
