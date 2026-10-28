"use client";



import { useMemo } from "react";


import { DataTable, cn, ChartPanel } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { type RankingItem, type RankingValue } from "@stats47/ranking";
import { ColumnDef } from "@tanstack/react-table";
import { Table as TableIcon } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { ChartEmptyState } from "@/components/charts/ChartState";

import { navSurfaceProps } from "@/lib/analytics/events";

import {
  formatRankingValue,
  resolveRankingPrecision,
} from "../../utils/compute-ranking-header-stats";

import { buildRankingRows, type RankingDataRow } from "./ranking-rows";

import type { StatsSchema } from "@stats47/types";


const PREFECTURE_CODE_PATTERN = /^\d{2}000$/;


interface Props {
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** ランキング項目情報（unit、rankingDirectionなど） */
  rankingItem?: RankingItem;
  /** CSSクラス名 */
  className?: string;
  /** CardHeader右側に表示するアクション要素 */
  headerActions?: React.ReactNode;
  /** カードタイトル（省略時: 都道府県別の表）。地図カードと同じアイコン付きの見出しで描く */
  cardTitle?: string;
  /** カード下部に表示するコンテンツ（出典等） */
  cardFooter?: React.ReactNode;
  /** カードの枠を付けずに表だけを描く (地図と 1 枚の枠に並べるランキングページ用) */
  bare?: boolean;
  /** 県を選んで詳細パネルを開く (ランキングページ用)。渡すと順位のセルがボタンになり、行の押下でも開く */
  onSelectArea?: (areaCode: string) => void;
  /** 詳細パネルで開いている県 (行に地の色を付ける) */
  selectedAreaCode?: string | null;
}

/**
 * 列幅 (px)。合計はランキングページで地図の右に並べる表の列 (RANKING_TABLE_FRAME_WIDTH) に収める。
 * 都道府県が 150px だった頃は合計 410px で、右端の「偏差値」が切れていた (UI-FIX-RANKING-OLD-2YEARS-20261018)。
 * 最も長い県名 (4 文字) は 52px + 左右の余白 16px で、100px に収まる。
 * 見出しには並べ替えのボタンが付くので、これより詰めると見出しが収まらない (2026-10-28 に 44・84・120・60px で
 * 試し、見出しの実寸 68・92・120・80px が列からはみ出した)。
 */
export const RANKING_TABLE_COLUMN_WIDTHS = { rank: 60, areaName: 100, value: 120, deviationValue: 80 } as const;
export const RANKING_TABLE_FRAME_WIDTH = 380;

export function RankingDataTable({
  rankingValues,
  rankingItem,
  className,
  headerActions,
  cardTitle = "都道府県別の表",
  cardFooter,
  bare = false,
  onSelectArea,
  selectedAreaCode,
}: Props) {
  // 順位と偏差値を付けた行 (県の詳細パネルと同じ計算)
  const processedData = useMemo(() => buildRankingRows(rankingValues), [rankingValues]);

  // カラム定義
  // 桁数は 47 県の値から 1 度だけ決める。値ごとに整形すると 60.4 と 44 が混ざり、
  // ヘッダー (formatRankingValue) とも食い違う (旧実装で実際に起きていた)
  const precision = useMemo(
    () =>
      resolveRankingPrecision(
        processedData.map((d) => d.value).filter((v): v is number => v !== null),
      ),
    [processedData],
  );

  const columns = useMemo<ColumnDef<RankingDataRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "順位",
        meta: { width: `${RANKING_TABLE_COLUMN_WIDTHS.rank}px` },
        cell: ({ row }) => {
          const { areaCode, areaName } = row.original;
          if (onSelectArea && PREFECTURE_CODE_PATTERN.test(areaCode)) {
            return (
              <button
                type="button"
                className="w-full text-center font-medium underline decoration-dotted underline-offset-4 hover:text-primary"
                aria-label={`${areaName}の詳細を開く`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectArea(areaCode);
                }}
              >
                {row.getValue("rank")}
              </button>
            );
          }
          return <div className="text-center font-medium">{row.getValue("rank")}</div>;
        },
      },
      {
        accessorKey: "areaName",
        header: "都道府県",
        meta: { width: `${RANKING_TABLE_COLUMN_WIDTHS.areaName}px` },
        cell: ({ row }) => {
          const { areaCode, areaName } = row.original;
          if (PREFECTURE_CODE_PATTERN.test(areaCode)) {
            return (
              <Link
                {...navSurfaceProps("ranking_table")}
                href={hrefFor("area", { areaCode })}
                className="font-medium hover:underline hover:text-primary"
                prefetch={false}
                // 県のページへの移動を優先し、行の押下 (詳細パネル) を起こさない
                onClick={(event) => event.stopPropagation()}
              >
                {areaName}
              </Link>
            );
          }
          return <div className="font-medium">{areaName}</div>;
        },
      },
      {
        accessorKey: "value",
        header: () => <div className="text-right">値</div>,
        meta: { width: `${RANKING_TABLE_COLUMN_WIDTHS.value}px` },
        cell: ({ row }) => {
          const unit = formatUnitForDisplay(rankingItem?.unit || processedData[0]?.unit || "");
          return (
            <div className="text-right tabular-nums whitespace-nowrap">
              {formatRankingValue(row.getValue<number>("value"), precision)}
              {unit && (
                <span className="text-xs text-muted-foreground ml-1">{formatUnitForDisplay(unit)}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "deviationValue",
        header: "偏差値",
        meta: { width: `${RANKING_TABLE_COLUMN_WIDTHS.deviationValue}px` },
        cell: ({ row }) => {
          const val = row.getValue<number | null>("deviationValue");
          return (
            <div className="text-right tabular-nums text-muted-foreground">
              {val === null ? "-" : val.toFixed(1)}
            </div>
          );
        },
      },
    ],
    [rankingItem, processedData, precision, onSelectArea]
  );

  if (!rankingValues || processedData.length === 0) {
    const empty = <ChartEmptyState message="データがありません" height={128} />;
    if (bare) return <div className={cn("w-full", className)}>{empty}</div>;
    return <ChartPanel className={cn("w-full", className)}>{empty}</ChartPanel>;
  }

  const table = (
      <DataTable
        columns={columns}
        data={processedData}
        showIndex={false}
        maxRows={10}
        enableSorting={true}
        showRowCount={false}
        className="h-full flex flex-col"
        getRowId={(row) => row.areaCode}
        onRowClick={
          onSelectArea
            ? (row) => {
                if (PREFECTURE_CODE_PATTERN.test(row.areaCode)) onSelectArea(row.areaCode);
              }
            : undefined
        }
        rowClassName={
          onSelectArea
            ? (row) =>
                cn(
                  PREFECTURE_CODE_PATTERN.test(row.areaCode) && "cursor-pointer",
                  row.areaCode === selectedAreaCode && "bg-muted",
                )
            : undefined
        }
        ariaLabel={`${rankingItem?.title ?? "ランキング"}の都道府県別データ表`}
        caption={`${rankingItem?.title ?? "ランキング"}の47都道府県別ランキング表。順位・都道府県名・値・偏差値の列。`}
      />
  );

  if (bare) return <div className={cn("w-full", className)}>{table}</div>;

  return (
    <ChartPanel
      title={cardTitle}
      icon={<TableIcon />}
      action={headerActions}
      footer={cardFooter}
      className={cn("w-full", className)}
    >
      {table}
    </ChartPanel>
  );
}
