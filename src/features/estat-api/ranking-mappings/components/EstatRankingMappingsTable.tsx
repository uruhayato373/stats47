"use client";

import { useMemo, useState } from "react";

import { ColumnDef } from "@tanstack/react-table";
import { Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import { Switch } from "@/components/atoms/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/ui/tooltip";
import { DataTable } from "@/components/molecules/data-table/data-table";

import { convertToRankingAction, updateIsRankingAction } from "../actions";

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
      const result = await updateIsRankingAction(
        mapping.stats_data_id,
        mapping.cat01,
        !isRanking
      );
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
    <div className="flex items-center justify-center">
      <Switch
        checked={isRanking}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
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
      const result = await convertToRankingAction(
        mapping.stats_data_id,
        mapping.cat01
      );
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleConvert}
            disabled={isConverting || !mapping.is_ranking}
            className="h-8 w-8"
          >
            {isConverting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>変換実行</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EstatRankingMappingsTable({
  mappings,
  onRefresh,
}: EstatRankingMappingsTableProps) {
  // 統計表IDのユニークな値の一覧を取得
  const statsDataIdOptions = useMemo(() => {
    const uniqueIds = Array.from(
      new Set(mappings.map((m) => m.stats_data_id))
    ).sort();
    return uniqueIds.map((id) => ({ value: id, label: id }));
  }, [mappings]);

  const columns = useMemo<ColumnDef<EstatRankingMapping>[]>(
    () => [
      {
        accessorKey: "stats_data_id",
        header: "統計表ID",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.stats_data_id}</div>
        ),
        meta: {
          filterable: true,
          filterType: "select",
          filterOptions: statsDataIdOptions,
        },
      },
      {
        accessorKey: "cat01",
        header: "分類コード",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.cat01}</div>
        ),
        meta: { filterable: false, width: "100px" },
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
        meta: { filterable: false },
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
        accessorKey: "area_type",
        header: "地域タイプ",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.area_type === "prefecture"
              ? "都道府県"
              : row.original.area_type === "city"
              ? "市区町村"
              : row.original.area_type === "national"
              ? "全国"
              : row.original.area_type}
          </div>
        ),
        meta: {
          filterable: true,
          filterType: "select",
          filterOptions: [
            { value: "prefecture", label: "都道府県" },
            { value: "city", label: "市区町村" },
            { value: "national", label: "全国" },
          ],
          width: "100px",
        },
      },
      {
        accessorKey: "is_ranking",
        header: "ランキング",
        cell: ({ row }) => (
          <IsRankingSwitchCell mapping={row.original} onRefresh={onRefresh} />
        ),
        filterFn: (row, id, value) => {
          // boolean値を文字列として比較
          const rowValue = row.getValue(id) as boolean;
          if (value === "") return true; // "すべて"選択時
          const filterValue = value === "true";
          return rowValue === filterValue;
        },
        meta: {
          filterable: true,
          filterType: "select",
          width: "80px",
          filterOptions: [
            { value: "true", label: "対象" },
            { value: "false", label: "非対象" },
          ],
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <ConvertButtonCell mapping={row.original} onRefresh={onRefresh} />
        ),
        enableSorting: false,
        meta: { width: "60px" },
      },
    ],
    [onRefresh, statsDataIdOptions]
  );

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={mappings}
        emptyMessage="ランキングマッピングがありません"
        showIndex={false}
        showBorder={false}
      />
    </div>
  );
}
