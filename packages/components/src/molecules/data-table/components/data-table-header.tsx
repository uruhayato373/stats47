"use client";

import { Table } from "@tanstack/react-table";

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
        <thead className="[&_tr]:border-b [&_tr]:border-border sticky top-0 bg-background z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
                <tr
                    key={headerGroup.id}
                    className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                    {headerGroup.headers.map((header) => (
                        <DataTableHeaderCell
                            key={header.id}
                            header={header}
                            enableSorting={enableSorting}
                        />
                    ))}
                </tr>
            ))}
        </thead>
    );
}
