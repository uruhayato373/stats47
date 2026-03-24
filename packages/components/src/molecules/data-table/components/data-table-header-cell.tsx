"use client";

import { flexRender, Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "../../../atoms/ui/button";

interface DataTableHeaderCellProps<TData, TValue> {
    header: Header<TData, TValue>;
    enableSorting?: boolean;
}

/**
 * テーブルヘッダーセルコンポーネント
 * ソート機能付き
 */
export function DataTableHeaderCell<TData, TValue>({
    header,
    enableSorting = true,
}: DataTableHeaderCellProps<TData, TValue>) {
    const width = header.column.columnDef.meta?.width;
    const minWidth = header.column.columnDef.meta?.minWidth;
    const canSort = enableSorting && header.column.getCanSort();
    const sortDirection = header.column.getIsSorted();

    if (header.isPlaceholder) {
        return (
            <th
                style={{ width, minWidth }}
                className="h-10 px-1 py-1 text-xs text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
            />
        );
    }

    if (!canSort) {
        return (
            <th
                style={{ width, minWidth }}
                className="h-10 px-1 py-1 text-xs text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
            >
                {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
        );
    }

    return (
        <th
            style={{ width, minWidth }}
            className="h-10 px-1 py-1 text-xs text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
        >
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs data-[state=open]:bg-accent"
                onClick={() => {
                    const currentSort = header.column.getIsSorted();
                    if (currentSort === false) {
                        header.column.toggleSorting(false); // 昇順
                    } else if (currentSort === "asc") {
                        header.column.toggleSorting(true); // 降順
                    } else {
                        header.column.clearSorting(); // ソート解除
                    }
                }}
            >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {sortDirection === "asc" ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                ) : sortDirection === "desc" ? (
                    <ArrowDown className="ml-2 h-3 w-3" />
                ) : (
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                )}
            </Button>
        </th>
    );
}
