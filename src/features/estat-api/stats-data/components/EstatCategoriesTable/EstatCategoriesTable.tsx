"use client";

import { DataTable } from "@/components/organisms/DataTable";
import { ColumnDef } from "@tanstack/react-table";

import {
  EstatStatsDataFormatter,
  EstatStatsDataResponse,
  FormattedCategory,
} from "@/features/estat-api";

interface EstatCategoriesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatCategoriesTable({
  data,
}: EstatCategoriesTableProps) {
  if (!data) return null;

  // FormattedCategoryデータを取得
  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const categories = formattedData.categories;

  const columns: ColumnDef<FormattedCategory>[] = [
    {
      accessorKey: "categoryCode",
      header: "カテゴリコード",
      cell: ({ row }) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
          {row.original.categoryCode}
        </code>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "カテゴリ名（原文）",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.original.categoryName}
        </span>
      ),
    },
    {
      accessorKey: "displayName",
      header: "表示名",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.displayName}</span>
      ),
    },
    {
      accessorKey: "unit",
      header: "単位",
      cell: ({ row }) =>
        row.original.unit ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {row.original.unit}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      emptyMessage="カテゴリ情報がありません"
      showIndex
    />
  );
}
