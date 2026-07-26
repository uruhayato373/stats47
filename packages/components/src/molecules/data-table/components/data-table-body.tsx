"use client";

import { Table } from "@tanstack/react-table";

import { TableBody } from "../../../atoms/ui/table";

import { DataTableEmpty } from "./data-table-empty";
import { DataTableRow } from "./data-table-row";

interface DataTableBodyProps<TData> {
    table: Table<TData>;
    emptyMessage?: string;
    onRowClick?: (row: TData) => void;
    rowClassName?: (row: TData) => string | undefined;
}

/**
 * 通常のテーブルボディコンポーネント
 */
export function DataTableBody<TData>({
    table,
    emptyMessage = "データがありません",
    onRowClick,
    rowClassName,
}: DataTableBodyProps<TData>) {
    const rows = table.getRowModel().rows;

    return (
        <TableBody>
            {rows?.length ? (
                rows.map((row) => (
                    <DataTableRow
                        key={row.id}
                        row={row}
                        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                        className={rowClassName?.(row.original)}
                    />
                ))
            ) : (
                <DataTableEmpty
                    message={emptyMessage}
                    colSpan={table.getAllColumns().length}
                />
            )}
        </TableBody>
    );
}
