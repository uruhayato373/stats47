"use client";

import { Table } from "@tanstack/react-table";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import * as React from "react";

interface UseTableVirtualizationOptions<TData> {
  table: Table<TData>;
  dataLength: number;
  threshold?: number;
}

interface UseTableVirtualizationReturn {
  parentRef: React.RefObject<HTMLDivElement | null>;
  shouldVirtualize: boolean;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}

/**
 * テーブルの仮想化ロジックを管理するカスタムフック
 * データがthreshold件数以上の場合に仮想化を有効化
 */
export function useTableVirtualization<TData>({
  table,
  dataLength,
  threshold = 10000,
}: UseTableVirtualizationOptions<TData>): UseTableVirtualizationReturn {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const shouldVirtualize = dataLength >= threshold;

  // React Hooksのルールに従い、常に同じ順序で呼び出す必要があるため、
  // useVirtualizerは常に呼び出す（countを0に設定することで実質的に無効化）
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? table.getRowModel().rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 行の高さ（px）
    overscan: 5, // 前後5行をプリレンダリング
  });

  return {
    parentRef: parentRef as React.RefObject<HTMLDivElement | null>,
    shouldVirtualize,
    virtualizer,
  };
}
