"use client";

import { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

/**
 * 行選択の Checkbox は enableRowSelection のときだけ読む (行選択を使わない表の初回配信に載せない)。
 * React.lazy は描画されるまで import を始めない。
 */
const Checkbox = React.lazy(() =>
    import("../../../atoms/ui/checkbox").then((loaded) => ({ default: loaded.Checkbox }))
);

/** 読み込み中もセルの幅が動かないよう、Checkbox と同じ大きさの空き枠を置く。 */
const CHECKBOX_FALLBACK = <span aria-hidden="true" className="inline-block size-4" />;

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
                    <React.Suspense fallback={CHECKBOX_FALLBACK}>
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            indeterminate={
                                !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="すべて選択"
                        />
                    </React.Suspense>
                ),
                cell: ({ row }) => (
                    <React.Suspense fallback={CHECKBOX_FALLBACK}>
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="行を選択"
                        />
                    </React.Suspense>
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
