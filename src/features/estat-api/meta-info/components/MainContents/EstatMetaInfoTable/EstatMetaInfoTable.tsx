"use client";

import { useRouter } from "next/navigation";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/molecules/data-table";

import type { EstatMetaInfo } from "../../../types";

/**
 * EstatMetaInfoTableProps - e-Statメタ情報テーブルコンポーネントのプロパティ
 */
interface EstatMetaInfoTableProps {
  /** 保存済みメタ情報の配列 */
  data: EstatMetaInfo[];
}

/**
 * area_typeをバッジ表示用のラベルとスタイルに変換
 */
function getAreaTypeBadge(areaType: EstatMetaInfo["area_type"]) {
  const config = {
    national: {
      label: "全国",
      className:
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    prefecture: {
      label: "都道府県",
      className:
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    city: {
      label: "市区町村",
      className:
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
  };

  return config[areaType] || config.national;
}

/**
 * ISO 8601形式の日付文字列をYYYY-MM-DD形式に変換
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch {
    return dateString;
  }
}

/**
 * EstatMetaInfoTable - e-Statメタ情報テーブルコンポーネント
 *
 * データベースに登録されているEstatMetaInfo情報をDataTableで表示します。
 *
 * 機能:
 * - 保存済みメタ情報の一覧表示
 * - ソート機能（デフォルト: updated_at降順）
 * - フィルタリング機能（全カラム）
 * - ページネーション機能
 * - 行クリックで統計表IDの詳細ページに遷移
 *
 * @param data - 保存済みメタ情報の配列
 */
export default function EstatMetaInfoTable({ data }: EstatMetaInfoTableProps) {
  const router = useRouter();

  /**
   * 行クリックハンドラー
   * 統計表IDの詳細ページに遷移
   */
  const handleRowClick = (statsDataId: string) => {
    router.push(`/admin/dev-tools/estat-api/meta-info?statsId=${statsDataId}`);
  };

  /**
   * カラム定義
   */
  const columns: ColumnDef<EstatMetaInfo>[] = [
    {
      accessorKey: "stats_data_id",
      header: "統計表ID",
      cell: ({ row }) => {
        const statsDataId = row.original.stats_data_id;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(statsDataId);
            }}
            className="font-mono text-sm text-primary hover:underline"
          >
            {statsDataId}
          </button>
        );
      },
      meta: {
        filterable: true,
        filterType: "text",
        filterPlaceholder: "統計表IDで検索",
      },
    },
    {
      accessorKey: "stat_name",
      header: "政府統計名",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.stat_name}</span>
      ),
      meta: {
        filterable: true,
        filterType: "text",
        filterPlaceholder: "統計名で検索",
      },
    },
    {
      accessorKey: "title",
      header: "統計表タイトル",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.title}</span>
      ),
      meta: {
        filterable: true,
        filterType: "text",
        filterPlaceholder: "タイトルで検索",
      },
    },
    {
      accessorKey: "area_type",
      header: "地域レベル",
      cell: ({ row }) => {
        const badge = getAreaTypeBadge(row.original.area_type);
        return <span className={badge.className}>{badge.label}</span>;
      },
      meta: {
        filterable: true,
        filterType: "select",
      },
    },
    {
      accessorKey: "cycle",
      header: "調査周期",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.cycle || "-"}
        </span>
      ),
      meta: {
        filterable: true,
        filterType: "text",
      },
    },
    {
      accessorKey: "survey_date",
      header: "調査年月",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.survey_date || "-"}
        </span>
      ),
      meta: {
        filterable: true,
        filterType: "text",
      },
    },
    {
      accessorKey: "updated_at",
      header: "更新日時",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.updated_at)}
        </span>
      ),
      meta: {
        filterable: false,
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="保存済みのメタ情報がありません"
      maxRows={20}
      enableFiltering={true}
      enableSorting={true}
      showIndex={true}
      showBorder={true}
    />
  );
}
