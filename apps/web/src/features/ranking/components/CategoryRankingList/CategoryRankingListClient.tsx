"use client";

import Link from "next/link";


import { DataTable } from "@stats47/components";

import { ChartPanel } from "@/components/charts/ChartPanel";

import type { ColumnDef } from "@tanstack/react-table";

export interface CategoryRankingListItem {
  rankingKey: string;
  areaType: string;
  title: string;
  subtitle: string | null;
  latestYear: string;
  unit: string;
  description: string | null;
  demographicAttr: string | null;
  normalizationBasis: string | null;
}

/** モバイルではタイトル+年のみ、md以上で属性・基準・単位を表示 */
const columns: ColumnDef<CategoryRankingListItem>[] = [
  {
    accessorKey: "title",
    header: "タイトル",
    cell: ({ row }) => (
      <Link
        href={`/ranking/${row.original.rankingKey}`}
        className="hover:text-primary transition-colors font-medium"
      >
        {row.original.title}
      </Link>
    ),
    meta: {
      minWidth: "200px",
      filterable: true,
      filterPlaceholder: "キーワードで絞り込み（例: コンビニ）",
    },
  },
  {
    accessorKey: "latestYear",
    header: "年",
    cell: ({ getValue }) => getValue<string>(),
    meta: { width: "60px" },
  },
  {
    accessorKey: "unit",
    header: "単位",
    cell: ({ getValue }) => getValue<string>(),
    meta: { width: "80px" },
  },
];

interface CategoryRankingTableProps {
  items: CategoryRankingListItem[];
}

export function CategoryRankingTable({ items }: CategoryRankingTableProps) {
  return (
    <ChartPanel
      title={
        <>
          すべてのランキング
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {items.length}件
          </span>
        </>
      }
    >
      <DataTable
        columns={columns}
        data={items}
        emptyMessage="該当するランキングがありません"
        maxRows={20}
        enableFiltering={true}
        enableSorting={true}
        showIndex={false}
        showBorder={false}
        getRowId={(row) => `${row.rankingKey}-${row.areaType}`}
      />
    </ChartPanel>
  );
}
