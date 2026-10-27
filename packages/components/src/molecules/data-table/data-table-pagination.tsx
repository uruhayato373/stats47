"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "../../atoms/ui/button";

import { LazySelect } from "../lazy-select";

import { DATA_TABLE_STYLES } from "./constants";

const PAGE_SIZE_ITEMS = [10, 20, 30, 40, 50, 100].map((pageSize) => ({
    value: `${pageSize}`,
    label: `${pageSize}`,
}));

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    showRowCount?: boolean;
}

export function DataTablePagination<TData>({
    table,
    showRowCount = true,
}: DataTablePaginationProps<TData>) {
    const filteredRows = table.getFilteredRowModel().rows;
    const totalRows = table.getCoreRowModel().rows.length;
    const hasFilters = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between space-x-2 py-2">
            {showRowCount && (
                <div className="hidden sm:block flex-1 text-xs text-muted-foreground">
                    {hasFilters ? (
                        <span>
                            フィルター結果: {filteredRows.length}件 / 全{totalRows}件
                        </span>
                    ) : (
                        <span>全{totalRows}件</span>
                    )}
                </div>
            )}
            <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="flex flex-col space-y-1">
                    {/* Select の JS は初回操作で読む (配信サイズ策 D・LazySelect) */}
                    <LazySelect
                        value={`${table.getState().pagination.pageSize}`}
                        items={PAGE_SIZE_ITEMS}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                        placeholder={`${table.getState().pagination.pageSize}`}
                        aria-label="表示件数"
                        triggerClassName={DATA_TABLE_STYLES.paginationSelectTrigger}
                        side="top"
                    />
                </div>
                <div className="flex w-[80px] items-center justify-center text-xs font-medium">
                    ページ {table.getState().pagination.pageIndex + 1} /{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        className="hidden h-6 w-6 p-0 text-xs lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">最初のページに移動</span>
                        {"<<"}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">前のページに移動</span>
                        {"<"}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">次のページに移動</span>
                        {">"}
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-6 w-6 p-0 text-xs lg:flex"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">最後のページに移動</span>
                        {">>"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
