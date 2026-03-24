"use client";

import { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Checkbox } from "../../../atoms/ui/checkbox";

/**
 * インデックスカラム・行選択カラムを追加するカスタムフック
 */
export function useIndexColumn<TData, TValue>(
    columns: ColumnDef<TData, TValue>[],
    showIndex: boolean,
    enableRowSelection?: boolean
): ColumnDef<TData, TValue>[] {
    return React.useMemo(() => {
        const prefix: ColumnDef<TData, TValue>[] = [];

        if (enableRowSelection) {
            prefix.push({
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected()
                                ? true
                                : table.getIsSomePageRowsSelected()
                                  ? "indeterminate"
                                  : false
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="すべて選択"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="行を選択"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            });
        }

        if (showIndex) {
            prefix.push({
                id: "index",
                header: "インデックス",
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">{row.index + 1}</div>
                ),
                enableSorting: false,
                enableHiding: false,
            });
        }

        return prefix.length > 0 ? [...prefix, ...columns] : columns;
    }, [columns, showIndex, enableRowSelection]);
}
