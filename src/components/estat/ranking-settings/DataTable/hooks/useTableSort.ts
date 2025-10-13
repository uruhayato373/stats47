"use client";

import { useState, useMemo } from "react";
import { SortField, SortDirection } from "./types";

interface DataTableItem {
  areaCode: string;
  areaName: string;
  numericValue: number | null;
  displayValue?: string;
  unit?: string;
  categoryCode: string;
  timeCode: string;
  rank?: number;
}

interface UseTableSortOptions {
  rankingDirection?: "asc" | "desc";
}

export function useTableSort(
  data: DataTableItem[],
  options: UseTableSortOptions = {}
) {
  const { rankingDirection = "desc" } = options;
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 有効なデータのみを抽出してランキング用にソート
    const validData = data.filter(
      (item) => item.numericValue !== null && item.numericValue !== 0
    );
    const rankedData = [...validData]
      .sort((a, b) => {
        const diff = (a.numericValue || 0) - (b.numericValue || 0);
        return rankingDirection === "asc" ? diff : -diff;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // ユーザー指定のソートを適用
    return rankedData.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "rank":
          compareValue = a.rank! - b.rank!;
          break;
        case "prefecture":
          compareValue = (a.areaName || "").localeCompare(b.areaName || "");
          break;
        case "value":
          compareValue = (a.numericValue || 0) - (b.numericValue || 0);
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });
  }, [data, sortField, sortDirection, rankingDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rank" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return "neutral";
    }
    return sortDirection === "asc" ? "up" : "down";
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
  };
}
