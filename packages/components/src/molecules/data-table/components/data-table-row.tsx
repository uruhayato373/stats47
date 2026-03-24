"use client";

import { flexRender, Row } from "@tanstack/react-table";

import { cn } from "../../../lib/cn";

interface DataTableRowProps<TData> {
    row: Row<TData>;
    onClick?: () => void;
    className?: string;
}

/**
 * テーブル行コンポーネント
 */
export function DataTableRow<TData>({ row, onClick, className }: DataTableRowProps<TData>) {
    return (
        <tr
            key={row.id}
            className={cn(
                "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                onClick && "cursor-pointer",
                className,
            )}
            data-state={row.getIsSelected() && "selected"}
            onClick={onClick}
        >
            {row.getVisibleCells().map((cell) => {
                const width = cell.column.columnDef.meta?.width;
                const minWidth = cell.column.columnDef.meta?.minWidth;
                return (
                    <td
                        key={cell.id}
                        style={{ width, minWidth }}
                        className="px-1 py-1 text-xs align-middle [&:has([role=checkbox])]:pr-0"
                    >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                );
            })}
        </tr>
    );
}
