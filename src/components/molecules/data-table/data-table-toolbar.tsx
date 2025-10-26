"use client";

import { Input } from "@/components/atoms/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/molecules/ui/select";
import { Table } from "@tanstack/react-table";
import * as React from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  // フィルタリング可能なカラムを取得
  const filterableColumns = table
    .getAllColumns()
    .filter((column) => column.columnDef.meta?.filterable);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterableColumns.map((column) => {
          const meta = column.columnDef.meta;
          if (!meta?.filterable) return null;

          if (meta.filterType === "select") {
            // セレクトフィルター
            const uniqueValues = React.useMemo(() => {
              const values = column.getFacetedUniqueValues();
              return Array.from(values.keys()).filter(
                (value) => value && value !== "-"
              );
            }, [column]);

            return (
              <div key={column.id} className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {column.columnDef.header}:
                </span>
                <Select
                  value={(column.getFilterValue() as string) ?? ""}
                  onValueChange={(value) =>
                    column.setFilterValue(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {uniqueValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          } else {
            // テキストフィルター
            return (
              <div key={column.id} className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {column.columnDef.header}:
                </span>
                <Input
                  placeholder={meta.filterPlaceholder || "フィルター..."}
                  value={(column.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    column.setFilterValue(event.target.value)
                  }
                  className="h-8 w-[150px]"
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
