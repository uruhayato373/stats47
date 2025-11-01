"use client";

import { useState } from "react";

import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/atoms/ui/badge";
import { Button } from "@/components/atoms/ui/button";
import { Switch } from "@/components/atoms/ui/switch";
import { DataTable } from "@/components/molecules/data-table/data-table";

import { updateRankingItem } from "@/features/ranking/actions";

interface RankingItem {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  label: string;
  unit: string;
  isActive: boolean;
}

/**
 * 状態トグルスイッチセルコンポーネント
 */
function IsActiveSwitchCell({
  item,
  onRefresh,
}: {
  item: RankingItem;
  onRefresh?: () => void;
}) {
  const [isActive, setIsActive] = useState(item.isActive);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const result = await updateRankingItem({
        rankingKey: item.rankingKey,
        areaType: item.areaType,
        updates: {
          isActive: !isActive,
        },
      });
      if (result) {
        setIsActive(!isActive);
        toast.success(
          `ランキング項目を${!isActive ? "有効" : "無効"}にしました`
        );
        onRefresh?.();
      } else {
        toast.error("更新に失敗しました");
      }
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
    </div>
  );
}

const columns: ColumnDef<RankingItem>[] = [
  {
    accessorKey: "rankingKey",
    header: "ランキングキー",
    cell: ({ row }) => (
      <div className="font-mono">{row.original.rankingKey}</div>
    ),
  },
  {
    accessorKey: "areaType",
    header: "地域タイプ",
    cell: ({ row }) => {
      const areaType = row.original.areaType;
      const labels: Record<string, string> = {
        prefecture: "都道府県",
        city: "市区町村",
        national: "全国",
      };
      return <Badge variant="outline">{labels[areaType] || areaType}</Badge>;
    },
    meta: {
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "prefecture", label: "都道府県" },
        { value: "city", label: "市区町村" },
        { value: "national", label: "全国" },
      ],
      width: "120px",
    },
  },
  {
    accessorKey: "label",
    header: "ラベル",
    meta: { filterable: true, filterType: "text" },
  },
  {
    accessorKey: "unit",
    header: "単位",
    meta: { width: "80px" },
  },
  {
    accessorKey: "isActive",
    header: "状態",
    cell: ({ row, table }) => (
      <IsActiveSwitchCell
        item={row.original}
        onRefresh={() => {
          // テーブルデータを更新するため、親コンポーネントに通知
          const meta = table.options.meta as { onRefresh?: () => void };
          meta?.onRefresh?.();
        }}
      />
    ),
    filterFn: (row, id, value) => {
      // boolean値を文字列として比較
      const rowValue = row.getValue(id) as boolean;
      if (value === "" || value === "all") return true; // "すべて"選択時
      const filterValue = value === "true";
      return rowValue === filterValue;
    },
    meta: {
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "有効" },
        { value: "false", label: "無効" },
      ],
      width: "80px",
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => (
      <Link href={`/admin/dev-tools/ranking-items/${row.original.rankingKey}`}>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
          <span className="sr-only">編集</span>
        </Button>
      </Link>
    ),
    enableSorting: false,
    meta: { width: "80px" },
  },
];

interface RankingItemsTableProps {
  items: RankingItem[];
  onRefresh?: () => void;
}

export function RankingItemsTable({
  items,
  onRefresh,
}: RankingItemsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="ランキング項目がありません"
      showIndex={false}
      showBorder={false}
      meta={{ onRefresh }}
    />
  );
}
