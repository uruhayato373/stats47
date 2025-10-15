/**
 * 高度な統計表検索コンポーネント
 * 複数条件の組み合わせ検索、AND/OR検索、日付範囲指定など
 */

"use client";

import { useState, useCallback } from "react";
import {
  AdvancedStatsListSearchOptions,
  STATS_FIELDS,
} from "@/lib/estat-api/types/stats-list";
import {
  formatSurveyDate,
  normalizeSearchKeyword,
  isValidDateRange,
} from "@/lib/estat-api/stats-list/utils";

interface AdvancedStatsListSearchProps {
  onSearch: (options: AdvancedStatsListSearchOptions) => void;
  isLoading?: boolean;
  searchHistory?: Array<{
    id: string;
    options: AdvancedStatsListSearchOptions;
    timestamp: number;
    resultCount: number;
  }>;
  onSearchFromHistory?: (options: AdvancedStatsListSearchOptions) => void;
}

export function AdvancedStatsListSearch({
  onSearch,
  isLoading = false,
  searchHistory = [],
  onSearchFromHistory,
}: AdvancedStatsListSearchProps) {
  // 検索条件の状態
  const [searchWord, setSearchWord] = useState("");
  const [searchKind, setSearchKind] = useState<"1" | "2">("1");
  const [statsField, setStatsField] = useState("");
  const [statsCode, setStatsCode] = useState("");
  const [collectArea, setCollectArea] = useState<"1" | "2" | "3" | "">("");
  const [surveyYears, setSurveyYears] = useState("");
  const [openYears, setOpenYears] = useState("");
  const [updatedDate, setUpdatedDate] = useState("");
  const [includeExplanation, setIncludeExplanation] = useState(false);
  const [cycleFilter, setCycleFilter] = useState<string[]>([]);
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");
  const [sortBy, setSortBy] = useState<
    "surveyDate" | "openDate" | "updatedDate" | "statName"
  >("surveyDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(100);

  // フォームの表示状態
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /**
   * 検索実行
   */
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // キーワードの正規化
      const normalizedKeyword = searchWord
        ? normalizeSearchKeyword(searchWord)
        : undefined;

      // 日付範囲のバリデーション
      if (
        dateRangeFrom &&
        dateRangeTo &&
        !isValidDateRange(dateRangeFrom, dateRangeTo)
      ) {
        alert(
          "日付範囲が正しくありません。開始日は終了日より前である必要があります。"
        );
        return;
      }

      const options: AdvancedStatsListSearchOptions = {
        ...(normalizedKeyword && { searchWord: normalizedKeyword }),
        searchKind,
        ...(statsField && { statsField: statsField as any }),
        ...(statsCode && { statsCode }),
        ...(collectArea && { collectArea }),
        ...(surveyYears && { surveyYears }),
        ...(openYears && { openYears }),
        ...(updatedDate && { updatedDate }),
        includeExplanation,
        ...(cycleFilter.length > 0 && { cycleFilter }),
        ...(dateRangeFrom || dateRangeTo
          ? {
              dateRangeFilter: {
                from: dateRangeFrom || undefined,
                to: dateRangeTo || undefined,
              },
            }
          : {}),
        sortBy,
        sortOrder,
        limit,
      };

      onSearch(options);
    },
    [
      searchWord,
      searchKind,
      statsField,
      statsCode,
      collectArea,
      surveyYears,
      openYears,
      updatedDate,
      includeExplanation,
      cycleFilter,
      dateRangeFrom,
      dateRangeTo,
      sortBy,
      sortOrder,
      limit,
      onSearch,
    ]
  );

  /**
   * フォームリセット
   */
  const handleReset = useCallback(() => {
    setSearchWord("");
    setSearchKind("1");
    setStatsField("");
    setStatsCode("");
    setCollectArea("");
    setSurveyYears("");
    setOpenYears("");
    setUpdatedDate("");
    setIncludeExplanation(false);
    setCycleFilter([]);
    setDateRangeFrom("");
    setDateRangeTo("");
    setSortBy("surveyDate");
    setSortOrder("desc");
    setLimit(100);
  }, []);

  /**
   * 周期フィルタの切り替え
   */
  const toggleCycleFilter = useCallback((cycle: string) => {
    setCycleFilter((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  }, []);

  /**
   * 履歴から検索
   */
  const handleSearchFromHistory = useCallback(
    (historyItem: (typeof searchHistory)[0]) => {
      if (onSearchFromHistory) {
        onSearchFromHistory(historyItem.options);
      }
    },
    [onSearchFromHistory]
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">高度な検索</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            {showAdvanced ? "簡易表示" : "詳細表示"}
          </button>
          {searchHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
            >
              履歴 ({searchHistory.length})
            </button>
          )}
        </div>
      </div>

      {/* 検索履歴 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">検索履歴</h3>
          <div className="space-y-2">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSearchFromHistory(item)}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {item.options.searchWord || "条件なし"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()} -{" "}
                    {item.resultCount}件
                  </div>
                </div>
                <div className="text-xs text-gray-400">→</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-6">
        {/* 基本検索条件 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="searchWord"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              検索キーワード
            </label>
            <input
              type="text"
              id="searchWord"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="統計名、表題、項目名など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="searchKind"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              検索種別
            </label>
            <select
              id="searchKind"
              value={searchKind}
              onChange={(e) => setSearchKind(e.target.value as "1" | "2")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">AND検索（すべてのキーワードを含む）</option>
              <option value="2">OR検索（いずれかのキーワードを含む）</option>
            </select>
          </div>
        </div>

        {/* 統計分野選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            統計分野
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(STATS_FIELDS).map(([code, field]) => (
              <label
                key={code}
                className={`flex items-center p-2 rounded border cursor-pointer ${
                  statsField === code
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="statsField"
                  value={code}
                  checked={statsField === code}
                  onChange={(e) => setStatsField(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg mr-2">{field.icon}</span>
                <span className="text-xs font-medium">{field.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 詳細検索条件 */}
        {showAdvanced && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="statsCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  政府統計コード
                </label>
                <input
                  type="text"
                  id="statsCode"
                  value={statsCode}
                  onChange={(e) => setStatsCode(e.target.value)}
                  placeholder="例: 00200522"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="collectArea"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  集計地域区分
                </label>
                <select
                  id="collectArea"
                  value={collectArea}
                  onChange={(e) =>
                    setCollectArea(e.target.value as "1" | "2" | "3" | "")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="1">全国</option>
                  <option value="2">都道府県</option>
                  <option value="3">市区町村</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="surveyYears"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  調査年月
                </label>
                <input
                  type="text"
                  id="surveyYears"
                  value={surveyYears}
                  onChange={(e) => setSurveyYears(e.target.value)}
                  placeholder="例: 202001 または 202001-202212"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="openYears"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  公開年月
                </label>
                <input
                  type="text"
                  id="openYears"
                  value={openYears}
                  onChange={(e) => setOpenYears(e.target.value)}
                  placeholder="例: 202001 または 202001-202212"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="updatedDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  更新日付
                </label>
                <input
                  type="date"
                  id="updatedDate"
                  value={updatedDate}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="limit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  取得件数
                </label>
                <select
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                  <option value={200}>200件</option>
                  <option value={500}>500件</option>
                  <option value={1000}>1000件</option>
                </select>
              </div>
            </div>

            {/* 日付範囲フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付範囲フィルタ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dateRangeFrom"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    開始日（YYYYMM）
                  </label>
                  <input
                    type="text"
                    id="dateRangeFrom"
                    value={dateRangeFrom}
                    onChange={(e) => setDateRangeFrom(e.target.value)}
                    placeholder="202001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dateRangeTo"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    終了日（YYYYMM）
                  </label>
                  <input
                    type="text"
                    id="dateRangeTo"
                    value={dateRangeTo}
                    onChange={(e) => setDateRangeTo(e.target.value)}
                    placeholder="202212"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 周期フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                周期フィルタ
              </label>
              <div className="flex flex-wrap gap-2">
                {["年次", "月次", "四半期", "週次", "日次", "不定期"].map(
                  (cycle) => (
                    <label
                      key={cycle}
                      className={`flex items-center px-3 py-1 rounded-full text-sm cursor-pointer ${
                        cycleFilter.includes(cycle)
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={cycleFilter.includes(cycle)}
                        onChange={() => toggleCycleFilter(cycle)}
                        className="sr-only"
                      />
                      {cycle}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* ソート条件 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sortBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ソート基準
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="surveyDate">調査年月</option>
                  <option value="openDate">公開日</option>
                  <option value="updatedDate">更新日</option>
                  <option value="statName">統計名</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ソート順序
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">降順（新しい順）</option>
                  <option value="asc">昇順（古い順）</option>
                </select>
              </div>
            </div>

            {/* その他のオプション */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeExplanation}
                  onChange={(e) => setIncludeExplanation(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">解説情報を含める</span>
              </label>
            </div>
          </>
        )}

        {/* ボタン */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            リセット
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "検索中..." : "検索実行"}
          </button>
        </div>
      </form>
    </div>
  );
}
