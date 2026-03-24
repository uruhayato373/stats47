"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@stats47/components";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";

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
    meta: { minWidth: "200px" },
  },
  {
    accessorKey: "demographicAttr",
    header: "属性",
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? (
        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded whitespace-nowrap">
          {v}
        </span>
      ) : "—";
    },
    meta: { width: "100px" },
  },
  {
    accessorKey: "normalizationBasis",
    header: "基準",
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? (
        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded whitespace-nowrap">
          {v}
        </span>
      ) : "—";
    },
    meta: { width: "120px" },
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
    <Card className="border border-border shadow-sm rounded-sm">
      <CardHeader>
        <CardTitle>
          すべてのランキング
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {items.length}件
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={items}
          emptyMessage="該当するランキングがありません"
          maxRows={20}
          enableFiltering={false}
          enableSorting={true}
          showIndex={false}
          showBorder={false}
          getRowId={(row) => `${row.rankingKey}-${row.areaType}`}
        />
      </CardContent>
    </Card>
  );
}
