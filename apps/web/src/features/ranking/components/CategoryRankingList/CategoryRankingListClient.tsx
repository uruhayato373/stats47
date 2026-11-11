"use client";


import { DataTable } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import Link from "@/components/atoms/SiteLink";

import { navSurfaceProps, type NavSurface } from "@/lib/analytics/events";

import type { ColumnDef } from "@tanstack/react-table";

export interface CategoryRankingListItem {
  rankingKey: string;
  areaType: string;
  title: string;
  latestYear: string;
  unit: string;
  topicLabel?: string | null;
  /** 1 位の地域と値 (「鳥取県 71.5%」。家計調査は県庁所在市の名前)。サーバーで rankingTop1Label から作る */
  top1?: string | null;
}

/** モバイルではタイトル+年のみ、md以上で属性・基準・単位を表示 */
function columnsForSurface(
  surface: Extract<NavSurface, "category_ranking_list" | "survey_ranking">,
): ColumnDef<CategoryRankingListItem>[] {
  return [
    {
      accessorKey: "title",
      header: "タイトル",
      cell: ({ row }) => (
        <Link
          {...navSurfaceProps(surface)}
          href={hrefFor("ranking", { rankingKey: row.original.rankingKey })}
          className="hover:text-primary transition-colors font-medium"
        >
          {row.original.title}
        </Link>
      ),
      meta: {
        minWidth: "200px",
        // 題名は長いものがあるので折り返す (1 行のままだと隣の 1 位の列に重なる。2026-11-03)
        wrap: true,
        filterable: true,
        filterPlaceholder: "ランキング名で探す",
      },
    },
    {
      // カテゴリのページの話題の箱 (2026-11-03 に撤去) が出していた 1 位を、一覧の列として残す
      accessorKey: "top1",
      header: "1位",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
      meta: { width: "160px" },
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
      cell: ({ getValue }) => formatUnitForDisplay(getValue<string>()),
      meta: { width: "80px" },
    },
  ];
}

interface CategoryRankingTableProps {
  items: CategoryRankingListItem[];
  /** 大規模な調査ハブでは既存の分類で一覧を探せるようにする。 */
  topicOptions?: Array<{ value: string; label: string }>;
  trackingSurface?: Extract<NavSurface, "category_ranking_list" | "survey_ranking">;
}

export function CategoryRankingTable({ items, topicOptions, trackingSurface = "category_ranking_list" }: CategoryRankingTableProps) {
  const searchable = topicOptions !== undefined;
  const columns = columnsForSurface(trackingSurface);
  const tableColumns: ColumnDef<CategoryRankingListItem>[] = searchable
    ? [
        ...columns,
        {
          accessorKey: "topicLabel",
          header: "分類",
          cell: ({ getValue }) => getValue<string>() || "その他",
          meta: {
            width: "120px",
            filterable: true,
            filterType: "select",
            filterOptions: topicOptions,
          },
        },
      ]
    : columns;
  return (
    <DataTable
      columns={tableColumns}
      data={items}
      emptyMessage="該当するランキングがありません"
      maxRows={20}
      enableFiltering={searchable}
      showIndex={false}
      getRowId={(row) => `${row.rankingKey}-${row.areaType}`}
      ariaLabel="すべてのランキング"
      caption="ランキングのタイトル・1位・年・単位の一覧"
    />
  );
}
