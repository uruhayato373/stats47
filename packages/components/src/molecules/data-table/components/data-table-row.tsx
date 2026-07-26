"use client";

import { flexRender, Row } from "@tanstack/react-table";

import { TableCell, TableRow } from "../../../atoms/ui/table";
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
        <TableRow
            key={row.id}
            className={cn(onClick && "cursor-pointer", className)}
            data-state={row.getIsSelected() && "selected"}
            onClick={onClick}
        >
            {row.getVisibleCells().map((cell) => {
                const width = cell.column.columnDef.meta?.width;
                const minWidth = cell.column.columnDef.meta?.minWidth;
                return (
                    <TableCell key={cell.id} style={{ width, minWidth }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                );
            })}
        </TableRow>
    );
}
