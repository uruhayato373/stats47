"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    Table,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

interface UseDataTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  defaultSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  maxRows?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  onSelectionChange?: (selectedRows: TData[]) => void;
  meta?: Record<string, unknown>;
}

/**
 * DataTableの状態管理とTanStack Tableの設定を行うカスタムフック
 */
export function useDataTable<TData>({
  data,
  columns,
  defaultSorting = [],
  initialColumnVisibility = {},
  maxRows = 100,
  enableSorting = true,
  enableFiltering = true,
  enableRowSelection = false,
  getRowId,
  onSelectionChange,
  meta,
}: UseDataTableOptions<TData>): Table<TData> {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialColumnVisibility
  );
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false,
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
      sorting: defaultSorting,
      columnVisibility: initialColumnVisibility,
    },
    enableSorting,
    enableFilters: enableFiltering,
    enableRowSelection,
    getRowId,
    meta,
  });

  const lastSelectedIdsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    if (!onSelectionChange || !enableRowSelection) return;

    const currentSelectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    
    // 前回の選択内容と比較して、変更がある場合のみ通知
    const isSelectionChanged = 
      currentSelectedIds.length !== lastSelectedIdsRef.current.length ||
      currentSelectedIds.some(id => !lastSelectedIdsRef.current.includes(id));

    if (!isSelectionChanged) return;

    lastSelectedIdsRef.current = currentSelectedIds;

    const selectedRows = getRowId 
      ? data.filter((row) => rowSelection[getRowId(row)])
      : data.filter((_, i) => rowSelection[String(i)]);
      
    onSelectionChange(selectedRows);
  }, [rowSelection, data, enableRowSelection, getRowId, onSelectionChange]);


  return table;
}
