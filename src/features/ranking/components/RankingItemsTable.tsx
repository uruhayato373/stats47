"use client";

import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/atoms/ui/badge";
import { Button } from "@/components/atoms/ui/button";
import { DataTable } from "@/components/molecules/data-table/data-table";

interface RankingItem {
  id: number;
  rankingKey: string;
  label: string;
  unit: string;
  isActive: boolean;
}

const columns: ColumnDef<RankingItem>[] = [
  {
    accessorKey: "rankingKey",
    header: "ランキングキー",
    cell: ({ row }) => (
      <div className="font-mono">{row.original.rankingKey}</div>
    ),
    meta: { filterable: true, filterType: "text" },
  },
  {
    accessorKey: "label",
    header: "ラベル",
    meta: { filterable: true, filterType: "text" },
  },
  {
    accessorKey: "unit",
    header: "単位",
  },
  {
    accessorKey: "isActive",
    header: "状態",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? "default" : "secondary"}
        className={
          row.original.isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        }
      >
        {row.original.isActive ? "有効" : "無効"}
      </Badge>
    ),
    meta: { filterable: true, filterType: "select" },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => (
      <Link href={`/admin/dev-tools/ranking-items/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          編集
        </Button>
      </Link>
    ),
    enableSorting: false,
  },
];

interface RankingItemsTableProps {
  items: RankingItem[];
}

export function RankingItemsTable({ items }: RankingItemsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="ランキング項目がありません"
      showIndex={false}
    />
  );
}

