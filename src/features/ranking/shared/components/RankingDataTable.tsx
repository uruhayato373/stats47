"use client";

/**
 * ランキングデータテーブル表示コンポーネント
 * 都道府県別ランキングデータをテーブル形式で表示
 */

import { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import type { StatsSchema } from "@/types/stats";

import type { RankingItem } from "../../items/types";

interface RankingDataTableProps {
  /** ランキングデータ */
  data?: StatsSchema[];
  /** ランキング項目情報（unit、rankingDirectionなど） */
  rankingItem?: RankingItem;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 都道府県ランキングデータテーブルコンポーネント
 */
export function RankingDataTable({
  data,
  rankingItem,
  className,
}: RankingDataTableProps) {
  // データをソートして順位を付ける
  const sortedData = useMemo(() => {
    if (!data) return [];

    // areaCode=00000（全国合計）のデータを除外
    const filteredData = data.filter((item) => item.areaCode !== "00000");

    // rankingDirectionに基づいてソート
    const direction = rankingItem?.rankingDirection || "desc";
    const sorted = [...filteredData].sort((a, b) => {
      if (direction === "desc") {
        // 降順：値が大きい順
        return b.value - a.value;
      } else {
        // 昇順：値が小さい順
        return a.value - b.value;
      }
    });

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [data, rankingItem?.rankingDirection]);

  // 単位を取得（metadata.jsonから取得したunitまたはrankingItem.unit）
  const unit = rankingItem?.unit || sortedData[0]?.unit || "";

  // データがない場合
  if (!data || sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  // 数値をフォーマット（カンマ区切り）
  const formatValue = (value: number): string => {
    return value.toLocaleString("ja-JP");
  };

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">順位</TableHead>
            <TableHead>都道府県</TableHead>
            <TableHead className="text-right">値</TableHead>
            {unit && <TableHead className="w-20">単位</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => (
            <TableRow key={item.areaCode}>
              <TableCell className="text-center font-medium">
                {item.rank}
              </TableCell>
              <TableCell className="font-medium">{item.areaName}</TableCell>
              <TableCell className="text-right font-mono">
                {formatValue(item.value)}
              </TableCell>
              {unit && <TableCell className="text-muted-foreground">{unit}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

