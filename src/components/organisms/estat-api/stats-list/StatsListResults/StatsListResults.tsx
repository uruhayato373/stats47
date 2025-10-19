"use client";

import { useState, useMemo } from "react";
import { StatsListTableInfo } from "@/lib/estat-api";
import {
  formatSurveyDate,
  formatOpenDate,
  getStatsFieldIcon,
  getStatsFieldName,
  getUpdateFrequency,
  truncateTitle,
} from "@/lib/estat-api/stats-list/utils";

interface StatsListResultsProps {
  tables: StatsListTableInfo[];
  totalCount: number;
  isLoading?: boolean;
  onTableSelect?: (table: StatsListTableInfo) => void;
  onToggleFavorite?: (table: StatsListTableInfo) => void;
  favorites?: StatsListTableInfo[];
  viewMode?: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  onSort?: (
    sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
    order: "asc" | "desc"
  ) => void;
  onFilter?: (filters: any) => void;
  sortBy?: "surveyDate" | "openDate" | "updatedDate" | "statName";
  sortOrder?: "asc" | "desc";
}

export function StatsListResults({
  tables,
  totalCount,
  isLoading = false,
  onTableSelect,
  onToggleFavorite,
  favorites = [],
  viewMode = "list",
  onViewModeChange,
  onSort,
  onFilter,
  sortBy = "surveyDate",
  sortOrder = "desc",
}: StatsListResultsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [cycleFilter, setCycleFilter] = useState<string[]>([]);
  const [organizationFilter, setOrganizationFilter] = useState<string[]>([]);

  // お気に入り状態を判定
  const isFavorite = (table: StatsListTableInfo) => {
    return favorites.some((fav) => fav.id === table.id);
  };

  // フィルタリングされたテーブル
  const filteredTables = useMemo(() => {
    let filtered = [...tables];

    // 周期フィルタ
    if (cycleFilter.length > 0) {
      filtered = filtered.filter(
        (table) => table.cycle && cycleFilter.includes(table.cycle)
      );
    }

    // 機関フィルタ
    if (organizationFilter.length > 0) {
      filtered = filtered.filter((table) =>
        organizationFilter.includes(table.govOrg)
      );
    }

    return filtered;
  }, [tables, cycleFilter, organizationFilter]);

  // 周期の一覧を取得
  const cycles = useMemo(() => {
    const cycleSet = new Set(
      tables.map((table) => table.cycle).filter(Boolean)
    );
    return Array.from(cycleSet).sort();
  }, [tables]);

  // 機関の一覧を取得
  const organizations = useMemo(() => {
    const orgSet = new Set(tables.map((table) => table.govOrg));
    return Array.from(orgSet).sort();
  }, [tables]);

  const handleCycleFilterToggle = (cycle: string) => {
    setCycleFilter((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  };

  const handleOrganizationFilterToggle = (org: string) => {
    setOrganizationFilter((prev) =>
      prev.includes(org) ? prev.filter((o) => o !== org) : [...prev, org]
    );
  };

  const handleSort = (
    field: "surveyDate" | "openDate" | "updatedDate" | "statName"
  ) => {
    if (onSort) {
      const newOrder =
        sortBy === field && sortOrder === "desc" ? "asc" : "desc";
      onSort(field, newOrder);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">検索中...</span>
        </div>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <p className="text-gray-500">検索結果が見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            検索結果 ({totalCount.toLocaleString()}件中 {filteredTables.length}
            件を表示)
          </h2>
          <div className="flex items-center space-x-2">
            {/* 表示モード切り替え */}
            {onViewModeChange && (
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`px-3 py-1 text-sm ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  リスト
                </button>
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`px-3 py-1 text-sm ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  グリッド
                </button>
              </div>
            )}

            {/* フィルタボタン */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              フィルタ
            </button>
          </div>
        </div>

        {/* ソートボタン */}
        {onSort && (
          <div className="mt-3 flex space-x-2">
            {[
              { field: "surveyDate", label: "調査年月" },
              { field: "openDate", label: "公開日" },
              { field: "updatedDate", label: "更新日" },
              { field: "statName", label: "統計名" },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field as any)}
                className={`px-3 py-1 text-xs rounded-md ${
                  sortBy === field
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
                {sortBy === field && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* フィルタパネル */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 周期フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                周期
              </label>
              <div className="flex flex-wrap gap-2">
                {cycles.map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => handleCycleFilterToggle(cycle)}
                    className={`px-2 py-1 text-xs rounded ${
                      cycleFilter.includes(cycle)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {getUpdateFrequency(cycle)}
                  </button>
                ))}
              </div>
            </div>

            {/* 機関フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作成機関
              </label>
              <div className="flex flex-wrap gap-2">
                {organizations.slice(0, 10).map((org) => (
                  <button
                    key={org}
                    onClick={() => handleOrganizationFilterToggle(org)}
                    className={`px-2 py-1 text-xs rounded ${
                      organizationFilter.includes(org)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {org}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {viewMode === "list" ? (
        <div className="divide-y divide-gray-200">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => onTableSelect?.(table)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl flex-shrink-0">
                      {table.mainCategory
                        ? getStatsFieldIcon(table.mainCategory.code as any)
                        : "📊"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {truncateTitle(table.title, 80)}
                      </h3>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">統計表ID:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {table.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-medium">政府統計名:</span>
                          <span>{table.statName}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-medium">作成機関:</span>
                          <span>{table.govOrg}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-medium">提供統計名:</span>
                          <span>{table.statisticsName}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {table.cycle && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {getUpdateFrequency(table.cycle)}
                          </span>
                        )}

                        {table.surveyDate && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            調査: {formatSurveyDate(table.surveyDate)}
                          </span>
                        )}

                        {table.openDate && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            公開: {formatOpenDate(table.openDate)}
                          </span>
                        )}

                        {table.mainCategory && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {getStatsFieldName(table.mainCategory.code as any)}
                          </span>
                        )}

                        {table.smallArea === "1" && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            小地域あり
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(table);
                      }}
                      className={`p-2 rounded-full ${
                        isFavorite(table)
                          ? "text-red-500 hover:text-red-600"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                      title={
                        isFavorite(table)
                          ? "お気に入りから削除"
                          : "お気に入りに追加"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill={isFavorite(table) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="text-right text-sm text-gray-500">
                    {table.totalNumber && (
                      <div>総件数: {table.totalNumber.toLocaleString()}</div>
                    )}
                    {table.updatedDate && (
                      <div>更新: {formatOpenDate(table.updatedDate)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
              onClick={() => onTableSelect?.(table)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {table.mainCategory
                    ? getStatsFieldIcon(table.mainCategory.code as any)
                    : "📊"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                    {truncateTitle(table.title, 50)}
                  </h3>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {table.id}
                    </div>
                    <div className="truncate">{table.statName}</div>
                    <div className="truncate">{table.govOrg}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {table.cycle && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {getUpdateFrequency(table.cycle)}
                      </span>
                    )}
                    {table.surveyDate && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {formatSurveyDate(table.surveyDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
