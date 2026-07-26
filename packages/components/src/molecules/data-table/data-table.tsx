"use client";

import { cn } from "../../lib/cn";

import { Table as TablePrimitive } from "../../atoms/ui/table";

import { type Table as TanStackTable } from "@tanstack/react-table";
import { DataTableBody } from "./components/data-table-body";
import { DataTableEmpty } from "./components/data-table-empty";
import { DataTableHeader } from "./components/data-table-header";
import { DataTableVirtualizedBody } from "./components/data-table-virtualized-body";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { useDataTable } from "./hooks/use-data-table";
import { useIndexColumn } from "./hooks/use-index-column";
import { useTableVirtualization } from "./hooks/use-table-virtualization";
import { DataTableProps } from "./types";
export * from "./components/data-table-column-header";

/**
 * DataTableコンポーネント
 * 
 * 汎用的なデータテーブルコンポーネント。ソート、フィルタリング、ページネーション、
 * 仮想化などの機能を提供します。
 */
export function DataTable<TData>({
    columns,
    data,
    emptyMessage = "データがありません",
    maxRows = 100,
    enableFiltering = true,
    enableSorting = true,
    showIndex = true,
    showBorder = false,
    enableRowSelection = false,
    getRowId,
    onSelectionChange,
    defaultSorting,
    initialColumnVisibility,
    meta,
    className,
    onRowClick,
    rowClassName,
    showRowCount = true,
    ariaLabel,
    caption,
}: DataTableProps<TData> & { className?: string }) {
    // インデックス・行選択カラムを追加
    const columnsWithExtras = useIndexColumn(columns, showIndex, enableRowSelection);

    // テーブル状態管理
    const table = useDataTable({
        data,
        columns: columnsWithExtras,
        defaultSorting,
        initialColumnVisibility,
        maxRows,
        enableSorting,
        enableFiltering,
        enableRowSelection,
        getRowId,
        onSelectionChange,
        meta,
    });

    // 仮想化の設定
    const { parentRef, shouldVirtualize, virtualizer } = useTableVirtualization({
        table,
        dataLength: data.length,
    });

    // 空の状態
    if (!data || data.length === 0) {
        return <DataTableEmpty message={emptyMessage} />;
    }

    return (
        <div className={cn("w-full space-y-2", className)}>
            {enableFiltering && <DataTableToolbar table={table} />}
            <div
                className={cn(
                    "flex min-h-0 flex-1 flex-col rounded-none",
                    showBorder && "border"
                )}
            >
                {shouldVirtualize ? (
                    <DataTableVirtualizedBody
                        ref={parentRef}
                        table={table as TanStackTable<unknown>}
                        virtualizer={virtualizer}
                    />
                ) : (
                    <TablePrimitive
                        containerClassName="min-h-0 flex-1"
                        className="min-w-max table-fixed"
                        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
                    >
                        {caption && (
                            <caption className="sr-only">{caption}</caption>
                        )}
                        <DataTableHeader
                            table={table}
                            enableSorting={enableSorting}
                        />
                        <DataTableBody
                            table={table}
                            emptyMessage={emptyMessage}
                            onRowClick={onRowClick}
                            rowClassName={rowClassName}
                        />
                    </TablePrimitive>
                )}
            </div>
            {!shouldVirtualize && <DataTablePagination table={table} showRowCount={showRowCount} />}
        </div>
    );
}
