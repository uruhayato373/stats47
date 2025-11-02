"use client";

import { Clock } from "lucide-react";

import { formatStatsData } from "@/features/estat-api/stats-data/services/formatter";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

/**
 * EstatOverviewのプロパティ
 */
interface EstatOverviewProps {
  /** e-Stat統計データレスポンス */
  data: EstatStatsDataResponse;
}

/**
 * e-Stat統計データ概要表示コンポーネント
 *
 * 機能:
 * - 統計データの基本情報表示（ステータス、統計表ID、統計表名など）
 * - データ詳細情報表示（データ件数、分類項目数、更新日時）
 * - 地域情報の表示（最大50件まで表示）
 *
 * @param data - e-Stat統計データレスポンス
 */
export default function EstatOverview({ data }: EstatOverviewProps) {
  if (!data?.GET_STATS_DATA) {
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
        <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
          基本情報
        </h3>
        <dl className="space-y-3">
          <InfoRow label="統計表ID" value={parameter?.STATS_DATA_ID || "-"} />
          {formattedData?.tableInfo && (
            <>
              <InfoRow
                label="統計表名"
                value={formattedData.tableInfo.statName}
              />
              <InfoRow label="表題" value={formattedData.tableInfo.title} />
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
            </>
          )}
        </dl>
      </div>

      {/* データ詳細セクション */}
      {statisticalData && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
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
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            地域情報 ({areas.length.toLocaleString()}件)
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {areas.slice(0, 50).map((area, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm text-foreground">
                    {area.areaName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    コード: {area.areaCode}
                  </div>
                  {area.level && (
                    <div className="text-xs text-muted-foreground">
                      レベル: {area.level}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {areas.length > 50 && (
              <div className="mt-3 text-sm text-muted-foreground text-center">
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
 * 情報行表示コンポーネント
 *
 * @param label - ラベル名
 * @param value - 表示する値（文字列またはReact要素）
 * @param highlight - ハイライト表示するか（デフォルト: false）
 * @param suffix - 値の後に表示する接尾辞（オプション）
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
      <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0">
        {label}
      </dt>
      <dd
        className={`text-sm mt-1 sm:mt-0 ${
          highlight ? "font-medium text-primary" : "text-foreground"
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
