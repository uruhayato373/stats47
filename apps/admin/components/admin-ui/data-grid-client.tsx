"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

import { Button, Input, Label, NativeSelect, NativeSelectOption, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ToggleGroup, ToggleGroupItem, cn } from "@stats47/components";

import { bodyCell, headCell } from "./table-frame";

/**
 * 並べ替え・検索・絞り込み・ページ送りのある一覧。公式 dashboard-01 の data-table の仕組みを、見本 (shadcndashboard.dev) の表の形で出す
 * (上に操作の列、rounded-lg border の表、下にページ送り) で、中身は TanStack Table。
 * サーバーのページから使えるよう、セルは描画済みの ReactNode で受け、並べ替えの値 (sort) と検索の文字列 (search) を別に渡す。
 * 行数が少ない静的な表は DataTable を使う (目安: 20 行を超える・並べ替えたい一覧はこちら)。
 */
export type GridColumn = {
  id: string;
  header: string;
  /** 数値の列は右寄せ・桁ぞろえ */
  numeric?: boolean;
  /** 並べ替えできる列 (sort に値がある列) */
  sortable?: boolean;
  nowrap?: boolean;
};

export type GridRow = {
  id: string;
  cells: ReactNode[];
  /** 列ごとの並べ替えの値 (cells と同じ順)。null は末尾 */
  sort?: (string | number | null)[];
  /** 検索の対象にする文字列 */
  search?: string;
  /** 絞り込み (facets) の値 */
  facet?: string;
  /** 行の強調 (失敗・要対応など) */
  tone?: "warn" | "bad";
};

/** サーバーから受け取る形。cells は配列でなく番号付きのオブジェクト (data-grid.tsx が変換する) */
export type ClientGridRow = Omit<GridRow, "cells"> & { cells: Record<number, ReactNode> };

const PAGE_SIZES = [20, 50, 100];

export function DataGridClient({
  columns,
  rows,
  searchPlaceholder = "絞り込み…",
  facets,
  pageSize = 20,
  empty = "該当なし",
}: {
  columns: GridColumn[];
  rows: ClientGridRow[];
  searchPlaceholder?: string;
  /** 絞り込みの選択肢 (値は GridRow.facet と照合)。先頭に「すべて」を自動で足す */
  facets?: { value: string; label: string }[];
  pageSize?: number;
  empty?: ReactNode;
}) {
  const pageSizeId = useId();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [facet, setFacet] = useState("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const searchable = rows.some((r) => r.search);

  const data = useMemo(() => (facet === "all" ? rows : rows.filter((r) => r.facet === facet)), [rows, facet]);
  const defs = useMemo<ColumnDef<ClientGridRow>[]>(
    () =>
      columns.map((c, i) => ({
        id: c.id,
        header: c.header,
        accessorFn: (r) => r.sort?.[i] ?? null,
        enableSorting: !!c.sortable,
        sortUndefined: "last",
        sortingFn: (a, b) => {
          const x = a.original.sort?.[i] ?? null;
          const y = b.original.sort?.[i] ?? null;
          if (x === y) return 0;
          if (x === null) return 1;
          if (y === null) return -1;
          return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ja");
        },
        cell: ({ row }) => row.original.cells[i],
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: defs,
    state: { sorting, globalFilter: query, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _id, value: string) => (row.original.search ?? "").toLowerCase().includes(value.trim().toLowerCase()),
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const shown = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.getState().pagination;

  return (
    <div className="flex flex-col gap-3">
      {searchable || facets?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {facets?.length ? (
            <ToggleGroup
              multiple={false}
              value={[facet]}
              onValueChange={(v) => {
                setFacet(v[0] ?? "all");
                table.setPageIndex(0);
              }}
              variant="outline"
              size="sm"
              className="flex-wrap"
            >
              <ToggleGroupItem value="all">すべて ({rows.length})</ToggleGroupItem>
              {facets.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value}>
                  {f.label} ({rows.filter((r) => r.facet === f.value).length})
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
          {searchable ? (
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                table.setPageIndex(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="ml-auto w-full sm:w-64"
            />
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header, i) => {
                  const col = columns[i];
                  const sorted = header.column.getIsSorted();
                  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon;
                  return (
                    <TableHead key={header.id} className={cn(headCell, col.numeric && "text-right!")}>
                      {header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={`${col.header}で並べ替え`}
                          className={cn("-ml-2.5", col.numeric && "-mr-2.5 ml-auto")}
                        >
                          {col.header}
                          <Icon className={cn(!sorted && "opacity-40")} />
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(row.original.tone === "bad" && "bg-negative/5", row.original.tone === "warn" && "bg-warning/5")}
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        bodyCell,
                        "align-top!",
                        columns[i].numeric ? "text-right tabular-nums" : "whitespace-normal!",
                        columns[i].nowrap && "whitespace-nowrap",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {shown > PAGE_SIZES[0] || table.getPageCount() > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground">
          <span>
            {shown} 件{shown !== rows.length ? ` (全 ${rows.length} 件)` : ""}
          </span>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <Label htmlFor={pageSizeId} className="font-normal">
                表示件数
              </Label>
              <NativeSelect
                id={pageSizeId}
                size="sm"
                value={String(table.getState().pagination.pageSize)}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZES.map((n) => (
                  <NativeSelectOption key={n} value={n}>
                    {n}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <span className="tabular-nums">
              {pageIndex + 1} / {Math.max(table.getPageCount(), 1)} ページ
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="最初のページ">
                <ChevronsLeftIcon />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="前のページ">
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="次のページ">
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="最後のページ"
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
