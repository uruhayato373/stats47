"use client";

import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

import { Badge } from "@/components/atoms/ui/badge";

import { formatStatsData } from "@/features/estat-api/stats-data/services/formatter";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

interface EstatOverviewProps {
  data: EstatStatsDataResponse;
}

export default function EstatOverview({ data }: EstatOverviewProps) {
  // デバッグログ
  console.log("[EstatOverview] データ状態:", {
    hasData: !!data,
    hasGetStatsData: !!data?.GET_STATS_DATA,
    getStatsData: data?.GET_STATS_DATA
      ? {
          hasResult: !!data.GET_STATS_DATA.RESULT,
          hasParameter: !!data.GET_STATS_DATA.PARAMETER,
          hasStatisticalData: !!data.GET_STATS_DATA.STATISTICAL_DATA,
        }
      : null,
  });

  if (!data?.GET_STATS_DATA) {
    console.warn("[EstatOverview] GET_STATS_DATAが存在しません", {
      data,
      keys: data ? Object.keys(data) : null,
    });
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>データが見つかりませんでした。</p>
        <p className="text-xs mt-2">GET_STATS_DATAが存在しません</p>
      </div>
    );
  }

  const result = data.GET_STATS_DATA.RESULT;
  const parameter = data.GET_STATS_DATA.PARAMETER;
  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;

  // 地域データを取得
  const formattedData = formatStatsData(data);
  const areas = formattedData.areas;

  return (
    <div className="space-y-8">
      {/* 基本情報セクション */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-neutral-700">
          基本情報
        </h3>
        <dl className="space-y-3">
          <InfoRow
            label="ステータス"
            value={
              result?.STATUS === 0 ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  成功
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  エラー (コード: {result?.STATUS})
                </Badge>
              )
            }
          />
          <InfoRow
            label="統計表ID"
            value={parameter?.STATS_DATA_ID || "-"}
            highlight
          />
          {formattedData?.tableInfo && (
            <>
              <InfoRow
                label="統計表名"
                value={formattedData.tableInfo.statName}
              />
              <InfoRow
                label="表題"
                value={formattedData.tableInfo.title}
                highlight
              />
              <InfoRow
                label="作成機関"
                value={formattedData.tableInfo.govOrg}
              />
              <InfoRow
                label="提供周期"
                value={formattedData.tableInfo.characteristics.cycle}
              />
              <InfoRow
                label="最終更新"
                value={formattedData.tableInfo.dates.updatedDate}
              />
              <InfoRow
                label="データ品質"
                value={
                  <Badge
                    variant={
                      (formattedData.metadata.quality?.completenessScore ||
                        0) >= 90
                        ? "default"
                        : (formattedData.metadata.quality?.completenessScore ||
                            0) >= 70
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      (formattedData.metadata.quality?.completenessScore ||
                        0) >= 90
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : (formattedData.metadata.quality?.completenessScore ||
                            0) >= 70
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : ""
                    }
                  >
                    {formattedData.metadata.quality?.completenessScore || 0}%
                    完全性
                  </Badge>
                }
              />
            </>
          )}
        </dl>
      </div>

      {/* データ詳細セクション */}
      {statisticalData && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-neutral-700">
            データ詳細
          </h3>
          <dl className="space-y-3">
            <InfoRow
              label="データ件数"
              value={
                Array.isArray(statisticalData.DATA_INF?.VALUE)
                  ? statisticalData.DATA_INF.VALUE.length.toLocaleString()
                  : statisticalData.DATA_INF?.VALUE
                  ? "1"
                  : "0"
              }
              suffix="件"
            />
            <InfoRow
              label="分類項目数"
              value={(
                statisticalData.CLASS_INF?.CLASS_OBJ?.length || 0
              ).toLocaleString()}
              suffix="項目"
            />
            <InfoRow
              label="更新日時"
              value={
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result?.DATE || "不明"}
                </span>
              }
            />
          </dl>
        </div>
      )}

      {/* 地域情報セクション */}
      {areas && areas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-neutral-700">
            地域情報 ({areas.length.toLocaleString()}件)
          </h3>
          <div className="max-h-64 overflow-y-auto">
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
  );
}

/**
 * InfoRow - 情報行表示コンポーネント
 */
function InfoRow({
  label,
  value,
  highlight = false,
  suffix,
}: {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:w-40 flex-shrink-0">
        {label}
      </dt>
      <dd
        className={`text-sm mt-1 sm:mt-0 ${
          highlight
            ? "font-medium text-blue-600 dark:text-blue-400"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {typeof value === "string" ? (
          <>
            {value || "-"}
            {suffix && <span className="ml-1">{suffix}</span>}
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
