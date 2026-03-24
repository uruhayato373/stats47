"use client";

import { Table } from "@tanstack/react-table";
import * as React from "react";
import { Input } from "../../atoms/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../atoms/ui/select";

import { DATA_TABLE_STYLES } from "./constants";

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
            <div className="flex flex-1 items-center gap-2 flex-wrap">
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

                        // filterOptionsが指定されている場合はそれを使用、なければユニーク値を使用
                        const options = React.useMemo(() => {
                            if (meta.filterOptions) {
                                // filterOptionsが指定されている場合は、指定されたすべてのオプションを表示
                                // フィルタリングは実際のデータ値に対して行われるため、全オプションを表示しても問題ない
                                return meta.filterOptions;
                            }
                            // filterOptionsがない場合はユニーク値を使用
                            return uniqueValues.map((value) => ({ value, label: value }));
                        }, [meta.filterOptions, uniqueValues]);

                        return (
                            <div key={column.id} className="flex flex-col space-y-1">
                                <span className={DATA_TABLE_STYLES.selectLabel}>
                                    {typeof column.columnDef.header === "string"
                                        ? column.columnDef.header
                                        : column.id}
                                </span>
                                <Select
                                    value={(column.getFilterValue() as string) ?? ""}
                                    onValueChange={(value) =>
                                        column.setFilterValue(value === "all" ? "" : value)
                                    }
                                >
                                    <SelectTrigger className={DATA_TABLE_STYLES.selectTrigger}>
                                        <SelectValue placeholder="すべて" />
                                    </SelectTrigger>
                                    <SelectContent className={DATA_TABLE_STYLES.selectContent}>
                                        <SelectItem value="all">すべて</SelectItem>
                                        {options.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    } else {
                        // テキストフィルター
                        return (
                            <div key={column.id} className="flex flex-col space-y-1">
                                <span className={DATA_TABLE_STYLES.selectLabel}>
                                    {typeof column.columnDef.header === "string"
                                        ? column.columnDef.header
                                        : column.id}
                                </span>
                                <Input
                                    placeholder={meta.filterPlaceholder || "フィルター..."}
                                    value={(column.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        column.setFilterValue(event.target.value)
                                    }
                                    className={DATA_TABLE_STYLES.textInput}
                                />
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
}
