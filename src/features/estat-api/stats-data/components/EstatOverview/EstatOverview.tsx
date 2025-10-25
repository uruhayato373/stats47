"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Info,
  MapPin,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Badge } from "@/components/atoms/ui/badge";

import {
  EstatStatsDataFormatter,
  EstatStatsDataResponse,
} from "@/lib/estat-api";

interface EstatOverviewProps {
  data: EstatStatsDataResponse;
}

export default function EstatOverview({ data }: EstatOverviewProps) {
  if (!data?.GET_STATS_DATA) return null;

  const result = data.GET_STATS_DATA.RESULT;
  const parameter = data.GET_STATS_DATA.PARAMETER;
  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;

  // 地域データを取得
  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const areas = formattedData.areas;

  return (
    <Accordion type="multiple" defaultValue={["basic"]} className="space-y-4">
      {/* 基本情報 */}
      <AccordionItem value="basic">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            基本情報
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                ステータス
              </dt>
              <dd className="mt-1">
                {result?.STATUS === 0 ? (
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

            {formattedData?.tableInfo && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    統計表名
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                    {formattedData.tableInfo.statName}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    表題
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                    {formattedData.tableInfo.title}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    作成機関
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                    {formattedData.tableInfo.govOrg}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    提供周期
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                    {formattedData.tableInfo.characteristics.cycle}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    最終更新
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                    {formattedData.tableInfo.dates.updatedDate}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    データ品質
                  </dt>
                  <dd className="mt-1">
                    <Badge
                      variant={
                        (formattedData.metadata.quality?.completenessScore ||
                          0) >= 90
                          ? "default"
                          : (formattedData.metadata.quality
                              ?.completenessScore || 0) >= 70
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        (formattedData.metadata.quality?.completenessScore ||
                          0) >= 90
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : (formattedData.metadata.quality
                              ?.completenessScore || 0) >= 70
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : ""
                      }
                    >
                      {formattedData.metadata.quality?.completenessScore || 0}%
                      完全性
                    </Badge>
                  </dd>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* データ詳細 */}
      {statisticalData && (
        <AccordionItem value="data">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              データ詳細
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 地域情報 */}
      {areas && areas.length > 0 && (
        <AccordionItem value="areas">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              地域情報 ({areas.length}件)
            </div>
          </AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
