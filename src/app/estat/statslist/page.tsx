"use client";

import { useState } from "react";
import {
  EstatStatsListFetcher,
  EstatStatsListFormatter,
  StatsListSearchOptions,
  StatsListSearchResult,
  FormattedTableInfo,
} from "@/lib/estat-api";
import {
  StatsListSearch,
  StatsListResults,
  StatsListPagination,
} from "@/components/estat-api/statslist";

export default function StatsListPage() {
  const [searchResult, setSearchResult] =
    useState<StatsListSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<FormattedTableInfo | null>(
    null
  );

  const handleSearch = async (options: StatsListSearchOptions) => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      console.log("🔵 Page: 検索開始", options);

      let response;
      if (options.searchWord) {
        response = await EstatStatsListFetcher.searchByKeyword(
          options.searchWord,
          options
        );
      } else if (options.statsCode) {
        response = await EstatStatsListFetcher.searchByStatsCode(
          options.statsCode,
          options
        );
      } else if (options.fieldCode) {
        response = await EstatStatsListFetcher.searchByField(
          options.fieldCode,
          options
        );
      } else {
        // デフォルト検索（全件取得）
        response = await EstatStatsListFetcher.fetchStatsList({
          limit: options.limit || 100,
          startPosition: options.startPosition || 1,
        });
      }

      const formattedResult =
        EstatStatsListFormatter.formatStatsListData(response);
      setSearchResult(formattedResult);

      console.log("✅ Page: 検索完了", formattedResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "検索に失敗しました";
      setError(errorMessage);
      console.error("❌ Page: 検索エラー", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = (table: FormattedTableInfo) => {
    setSelectedTable(table);
    console.log("📋 Page: 統計表選択", table);
  };

  const handleNextPage = () => {
    if (!searchResult?.pagination.nextKey) return;

    // 次のページの検索を実行
    const currentOptions = {
      limit: searchResult.tables.length,
      startPosition: searchResult.pagination.nextKey,
    };

    handleSearch(currentOptions);
  };

  const handlePreviousPage = () => {
    if (!searchResult) return;

    // 前のページの検索を実行
    const currentOptions = {
      limit: searchResult.tables.length,
      startPosition: Math.max(
        1,
        searchResult.pagination.fromNumber - searchResult.tables.length
      ),
    };

    handleSearch(currentOptions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            e-Stat 統計表検索
          </h1>
          <p className="text-gray-600">
            e-Stat APIを使用して統計表を検索し、統計表IDを取得できます。
          </p>
        </div>

        <div className="space-y-6">
          {/* 検索フォーム */}
          <StatsListSearch onSearch={handleSearch} isLoading={isLoading} />

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    エラーが発生しました
                  </h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* 検索結果 */}
          {searchResult && (
            <>
              <StatsListResults
                tables={searchResult.tables}
                totalCount={searchResult.totalCount}
                isLoading={isLoading}
                onTableSelect={handleTableSelect}
              />

              <StatsListPagination
                fromNumber={searchResult.pagination.fromNumber}
                toNumber={searchResult.pagination.toNumber}
                totalCount={searchResult.totalCount}
                nextKey={searchResult.pagination.nextKey}
                onNext={handleNextPage}
                onPrevious={handlePreviousPage}
                isLoading={isLoading}
              />
            </>
          )}

          {/* 選択された統計表の詳細 */}
          {selectedTable && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">選択された統計表</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>統計表ID:</strong> {selectedTable.id}
                </div>
                <div>
                  <strong>タイトル:</strong> {selectedTable.title}
                </div>
                <div>
                  <strong>政府統計名:</strong> {selectedTable.statName}
                </div>
                <div>
                  <strong>作成機関:</strong> {selectedTable.govOrg}
                </div>
                <div>
                  <strong>提供統計名:</strong> {selectedTable.statisticsName}
                </div>
                {selectedTable.mainCategory && (
                  <div>
                    <strong>分野:</strong> {selectedTable.mainCategory.name}
                  </div>
                )}
                {selectedTable.surveyDate && (
                  <div>
                    <strong>調査年月:</strong> {selectedTable.surveyDate}
                  </div>
                )}
                {selectedTable.openDate && (
                  <div>
                    <strong>公開日:</strong> {selectedTable.openDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
