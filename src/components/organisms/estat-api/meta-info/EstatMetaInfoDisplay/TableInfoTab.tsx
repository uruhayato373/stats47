import React from "react";
import { TableInfo } from "@/lib/estat-api/types/meta-info";

interface TableInfoTabProps {
  tableInfo: TableInfo;
}

/**
 * TableInfoTab - 統計表情報表示タブ
 *
 * 機能:
 * - 統計表の基本情報を整理して表示
 * - 統計表ID、タイトル、政府統計名、作成機関などの詳細情報
 * - 調査周期、公開日、レコード数などのメタデータ
 */
export default function TableInfoTab({ tableInfo }: TableInfoTabProps) {
  const infoItems = [
    {
      label: "統計表ID",
      value: tableInfo.id,
      highlight: true,
    },
    {
      label: "統計表題名",
      value: tableInfo.title,
      highlight: true,
    },
    {
      label: "政府統計名",
      value: tableInfo.statName,
    },
    {
      label: "作成機関",
      value: tableInfo.organization,
    },
    {
      label: "統計調査名",
      value: tableInfo.statisticsName,
    },
    {
      label: "調査周期",
      value: tableInfo.cycle,
    },
    {
      label: "調査年月日",
      value: tableInfo.surveyDate ? String(tableInfo.surveyDate) : "-",
    },
    {
      label: "公開日",
      value: tableInfo.openDate,
    },
    {
      label: "更新日",
      value: tableInfo.updatedDate,
    },
    {
      label: "小地域集計",
      value: tableInfo.smallArea ? "あり" : "なし",
    },
    {
      label: "集計地域",
      value: tableInfo.collectArea,
    },
    {
      label: "総レコード数",
      value: tableInfo.totalRecords.toLocaleString(),
    },
  ];

  const categoryInfo = [
    {
      label: "大分類",
      value: tableInfo.mainCategory.name,
      code: tableInfo.mainCategory.code,
    },
    ...(tableInfo.subCategory
      ? [
          {
            label: "小分類",
            value: tableInfo.subCategory.name,
            code: tableInfo.subCategory.code,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* 基本情報セクション */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          基本情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                item.highlight
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  : "bg-gray-50 border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
              }`}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {item.label}
              </div>
              <div
                className={`text-sm ${
                  item.highlight
                    ? "text-blue-900 dark:text-blue-100 font-medium"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {item.value || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分類情報セクション */}
      {categoryInfo.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            分類情報
          </h3>
          <div className="space-y-3">
            {categoryInfo.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.label}
                  </div>
                  {item.code && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      コード: {item.code}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 説明セクション */}
      {tableInfo.explanation && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            説明
          </h3>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {tableInfo.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
