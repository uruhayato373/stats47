"use client";

import * as React from "react";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableProps } from "./types";

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "データがありません",
  maxRows = 100,
  enableFiltering = true,
  enableSorting = true,
  showIndex = true,
  showBorder = true,
  defaultSorting,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSorting || []
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // インデックス列を追加
  const columnsWithIndex = React.useMemo(() => {
    if (!showIndex) return columns;

    const indexColumn: ColumnDef<TData, TValue> = {
      id: "index",
      header: "インデックス",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.index + 1}</div>
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [indexColumn, ...columns];
  }, [columns, showIndex]);

  const table = useReactTable({
    data,
    columns: columnsWithIndex,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: maxRows,
      },
      sorting: defaultSorting || [],
    },
    enableSorting,
    enableFilters: enableFiltering,
    meta,
  });

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enableFiltering && <DataTableToolbar table={table} />}
      <div className={showBorder ? "rounded-md border" : ""}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = header.column.columnDef.meta?.width;
                  return (
                    <TableHead key={header.id} style={{ width }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const width = cell.column.columnDef.meta?.width;
                    return (
                      <TableCell key={cell.id} style={{ width }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithIndex.length}
                  className="text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
