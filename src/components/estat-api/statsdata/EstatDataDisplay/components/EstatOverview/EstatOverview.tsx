"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Clock,
  MapPin,
} from "lucide-react";
import {
  EstatStatsDataResponse,
  EstatStatsDataFormatter,
} from "@/lib/estat-api";

interface EstatOverviewProps {
  data: EstatStatsDataResponse;
}

export default function EstatOverview({ data }: EstatOverviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!data?.GET_STATS_DATA) return null;

  const result = data.GET_STATS_DATA.RESULT;
  const parameter = data.GET_STATS_DATA.PARAMETER;
  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;

  // 地域データを取得
  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const areas = formattedData.areas;

  return (
    <div className="space-y-4">
      {/* 基本情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <button
          onClick={() => toggleSection("basic")}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
        >
          <h3 className="font-medium text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            基本情報
          </h3>
          {expandedSections.has("basic") ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {expandedSections.has("basic") && (
          <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                  ステータス
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  {result?.STATUS === 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        成功
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        エラー (コード: {result?.STATUS})
                      </span>
                    </>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                  統計表ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100 font-mono">
                  {parameter?.STATS_DATA_ID}
                </dd>
              </div>

              {statisticalData?.TABLE_INF && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                      統計表名
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                      {statisticalData.TABLE_INF.STAT_NAME?.["$"]}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                      表題
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                      {statisticalData.TABLE_INF.TITLE?.["$"]}
                    </dd>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* データ詳細 */}
      {statisticalData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
          <button
            onClick={() => toggleSection("data")}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            <h3 className="font-medium text-gray-800 dark:text-neutral-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              データ詳細
            </h3>
            {expandedSections.has("data") ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.has("data") && (
            <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    データ件数
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-neutral-100">
                    {Array.isArray(statisticalData.DATA_INF?.VALUE)
                      ? statisticalData.DATA_INF.VALUE.length
                      : statisticalData.DATA_INF?.VALUE
                      ? 1
                      : 0}{" "}
                    件
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                    分類項目数
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-neutral-100">
                    {statisticalData.CLASS_INF?.CLASS_OBJ?.length || 0} 項目
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    更新日時
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result?.DATE || "不明"}
                  </dd>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 地域情報 */}
      {areas && areas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
          <button
            onClick={() => toggleSection("areas")}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            <h3 className="font-medium text-gray-800 dark:text-neutral-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              地域情報 ({areas.length}件)
            </h3>
            {expandedSections.has("areas") ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.has("areas") && (
            <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
              <div className="mt-3 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {areas.slice(0, 50).map((area, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-700"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-neutral-100">
                        {area.areaName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        コード: {area.areaCode}
                      </div>
                      {area.level && (
                        <div className="text-xs text-gray-500 dark:text-neutral-400">
                          レベル: {area.level}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {areas.length > 50 && (
                  <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400 text-center">
                    {areas.length - 50}
                    件の地域が他にもあります。詳細は「値」タブで確認できます。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
