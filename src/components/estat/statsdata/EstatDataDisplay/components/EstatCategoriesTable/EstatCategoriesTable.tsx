"use client";

import { EstatStatsDataResponse } from "@/types/models/estat";
import { FormattedCategory } from "@/types/models/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { EstatDataFormatter } from "@/lib/estat/statsdata/EstatDataFormatter";

interface EstatCategoriesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatCategoriesTable({
  data,
}: EstatCategoriesTableProps) {
  if (!data) return null;

  // FormattedCategoryデータを取得
  const formattedData = EstatDataFormatter.formatStatsData(data);
  const categories = formattedData.categories;

  const columns: TableColumn<FormattedCategory>[] = [
    {
      key: "categoryCode",
      label: "カテゴリコード",
      render: (item) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
          {item.categoryCode}
        </code>
      ),
    },
    {
      key: "categoryName",
      label: "カテゴリ名（原文）",
      render: (item) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {item.categoryName}
        </span>
      ),
    },
    {
      key: "displayName",
      label: "表示名",
      render: (item) => <span className="font-medium">{item.displayName}</span>,
    },
    {
      key: "unit",
      label: "単位",
      render: (item) =>
        item.unit ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {item.unit}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        ),
    },
  ];

  return (
    <DataTable
      data={categories}
      columns={columns}
      emptyMessage="カテゴリ情報がありません"
    />
  );
}
