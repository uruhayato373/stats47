"use client";

import { flexRender, Table as TanStackTable } from "@tanstack/react-table";
import { Virtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import { Table, TableBody, TableCell, TableRow } from "../../../atoms/ui/table";

interface DataTableVirtualizedBodyProps<TData> {
    table: TanStackTable<TData>;
    virtualizer: Virtualizer<HTMLDivElement, Element>;
}

/**
 * 仮想化されたテーブルボディコンポーネント
 */
export const DataTableVirtualizedBody = React.forwardRef<
    HTMLDivElement,
    DataTableVirtualizedBodyProps<unknown>
>(function DataTableVirtualizedBody({ table, virtualizer }, ref) {
    return (
        <div ref={ref} className="overflow-auto border-t flex-1">
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                }}
            >
                <Table>
                    <TableBody>
                        {virtualizer.getVirtualItems().map(
                            (virtualRow: { index: number; size: number; start: number }) => {
                                const row = table.getRowModel().rows[virtualRow.index];
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const width = cell.column.columnDef.meta?.width;
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    style={{ width }}
                                                    className="text-xs"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            }
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});
