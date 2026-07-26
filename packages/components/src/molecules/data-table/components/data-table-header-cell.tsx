"use client";

import { flexRender, Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "../../../atoms/ui/button";
import { TableHead } from "../../../atoms/ui/table";

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
            <TableHead
                scope="col"
                style={{ width, minWidth }}
            />
        );
    }

    if (!canSort) {
        return (
            <TableHead
                scope="col"
                style={{ width, minWidth }}
            >
                {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
        );
    }

    return (
        <TableHead
            scope="col"
            style={{ width, minWidth }}
        >
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-6 px-2 text-xs data-[state=open]:bg-accent"
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
                    <ArrowUp className="ml-1.5 size-3" />
                ) : sortDirection === "desc" ? (
                    <ArrowDown className="ml-1.5 size-3" />
                ) : (
                    <ArrowUpDown className="ml-1.5 size-3" />
                )}
            </Button>
        </TableHead>
    );
}
