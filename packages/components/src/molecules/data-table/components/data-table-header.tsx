"use client";

import { Table } from "@tanstack/react-table";

import { TableHeader, TableRow } from "../../../atoms/ui/table";

import { DataTableHeaderCell } from "./data-table-header-cell";

interface DataTableHeaderProps<TData> {
    table: Table<TData>;
    enableSorting?: boolean;
}

/**
 * テーブルヘッダーコンポーネント
 */
export function DataTableHeader<TData>({
    table,
    enableSorting = true,
}: DataTableHeaderProps<TData>) {
    return (
        <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <DataTableHeaderCell
                            key={header.id}
                            header={header}
                            enableSorting={enableSorting}
                        />
                    ))}
                </TableRow>
            ))}
        </TableHeader>
    );
}
