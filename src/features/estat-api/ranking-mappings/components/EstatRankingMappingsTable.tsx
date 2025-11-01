"use client";

import { useMemo, useState } from "react";

import { ColumnDef } from "@tanstack/react-table";
import { Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import { DataTable } from "@/components/molecules/data-table/data-table";
import { Switch } from "@/components/atoms/ui/switch";

import {
  convertToRankingAction,
  updateIsRankingAction,
} from "../actions";

import type { EstatRankingMapping } from "../types";

interface EstatRankingMappingsTableProps {
  mappings: EstatRankingMapping[];
  onRefresh?: () => void;
}

/**
 * isRankingスイッチセルコンポーネント
 */
function IsRankingSwitchCell({
  mapping,
  onRefresh,
}: {
  mapping: EstatRankingMapping;
  onRefresh?: () => void;
}) {
  const [isRanking, setIsRanking] = useState(mapping.is_ranking);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const result = await updateIsRankingAction(mapping.id, !isRanking);
      if (result.success) {
        setIsRanking(!isRanking);
        toast.success(result.message);
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isRanking}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
      <span className="text-sm text-muted-foreground">
        {isRanking ? "対象" : "非対象"}
      </span>
    </div>
  );
}

/**
 * 変換実行ボタンセルコンポーネント
 */
function ConvertButtonCell({
  mapping,
  onRefresh,
}: {
  mapping: EstatRankingMapping;
  onRefresh?: () => void;
}) {
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!mapping.is_ranking) {
      toast.error("ランキング変換対象に設定してください");
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertToRankingAction(mapping.id);
      if (result.success) {
        toast.success(result.message);
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("ランキング変換に失敗しました");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleConvert}
      disabled={isConverting || !mapping.is_ranking}
      className="gap-2"
    >
      {isConverting ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      <span>変換実行</span>
    </Button>
  );
}

export function EstatRankingMappingsTable({
  mappings,
  onRefresh,
}: EstatRankingMappingsTableProps) {
  const columns = useMemo<ColumnDef<EstatRankingMapping>[]>(
    () => [
      {
        accessorKey: "stats_data_id",
        header: "統計表ID",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.stats_data_id}</div>
        ),
        meta: { filterable: true, filterType: "text" },
      },
      {
        accessorKey: "cat01",
        header: "分類コード",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.cat01}</div>
        ),
        meta: { filterable: true, filterType: "text" },
      },
      {
        accessorKey: "item_name",
        header: "項目名",
        meta: { filterable: true, filterType: "text" },
      },
      {
        accessorKey: "item_code",
        header: "項目コード",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.item_code}</div>
        ),
        meta: { filterable: true, filterType: "text" },
      },
      {
        accessorKey: "unit",
        header: "単位",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.unit || "-"}
          </div>
        ),
        meta: { width: "80px" },
      },
      {
        accessorKey: "is_ranking",
        header: "ランキング変換対象",
        cell: ({ row }) => (
          <IsRankingSwitchCell mapping={row.original} onRefresh={onRefresh} />
        ),
        meta: { filterable: true, filterType: "select", width: "150px" },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <ConvertButtonCell mapping={row.original} onRefresh={onRefresh} />
        ),
        enableSorting: false,
        meta: { width: "120px" },
      },
    ],
    [onRefresh]
  );

  return (
    <DataTable
      columns={columns}
      data={mappings}
      emptyMessage="ランキングマッピングがありません"
      showIndex
      showBorder={false}
    />
  );
}
