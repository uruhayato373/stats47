"use client";

import { FormattedTableInfo } from "@/lib/estat-api";

interface StatsListResultsProps {
  tables: FormattedTableInfo[];
  totalCount: number;
  isLoading?: boolean;
  onTableSelect?: (table: FormattedTableInfo) => void;
}

export function StatsListResults({
  tables,
  totalCount,
  isLoading = false,
  onTableSelect,
}: StatsListResultsProps) {
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
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">
          検索結果 ({totalCount.toLocaleString()}件中 {tables.length}件を表示)
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {tables.map((table) => (
          <div
            key={table.id}
            className="p-6 hover:bg-gray-50 cursor-pointer"
            onClick={() => onTableSelect?.(table)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {table.title}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">統計表ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
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

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  {table.cycle && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {table.cycle}
                    </span>
                  )}

                  {table.surveyDate && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      調査: {table.surveyDate}
                    </span>
                  )}

                  {table.openDate && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      公開: {table.openDate}
                    </span>
                  )}

                  {table.mainCategory && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {table.mainCategory.name}
                    </span>
                  )}

                  {table.smallArea === "1" && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      小地域あり
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4 text-right text-sm text-gray-500">
                {table.totalNumber && (
                  <div>総件数: {table.totalNumber.toLocaleString()}</div>
                )}
                {table.updatedDate && <div>更新: {table.updatedDate}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
