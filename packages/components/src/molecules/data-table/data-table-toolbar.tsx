"use client";

import { Column, Table } from "@tanstack/react-table";
import * as React from "react";

import { Input } from "../../atoms/ui/input";
import { LazySelect, type LazySelectItem } from "../lazy-select";

import { DATA_TABLE_STYLES } from "./constants";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
}

const ALL_VALUE = "all";
const ALL_LABEL = "すべて";

function columnLabel<TData>(column: Column<TData, unknown>): string {
    return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

function SelectColumnFilter<TData>({ column }: { column: Column<TData, unknown> }) {
    const filterOptions = column.columnDef.meta?.filterOptions;
    const facetedValues = column.getFacetedUniqueValues();

    // filterOptions が指定されている場合はそれを使い、なければ実データのユニーク値を使う。
    // フィルタリングは実際のデータ値に対して行うため、指定された全オプションを表示しても問題ない。
    const items = React.useMemo<LazySelectItem[]>(() => {
        const options = filterOptions
            ? filterOptions
            : Array.from(facetedValues.keys())
                  .filter((value): value is string => typeof value === "string" && value !== "" && value !== "-")
                  .map((value) => ({ value, label: value }));
        return [{ value: ALL_VALUE, label: ALL_LABEL }, ...options];
    }, [filterOptions, facetedValues]);

    const rawValue = column.getFilterValue();
    const value = typeof rawValue === "string" && rawValue !== "" ? rawValue : ALL_VALUE;

    return (
        <div className="flex flex-col space-y-1">
            <span className={DATA_TABLE_STYLES.selectLabel}>{columnLabel(column)}</span>
            {/* Select の JS は初回操作で読む (配信サイズ策 D・LazySelect) */}
            <LazySelect
                value={value}
                items={items}
                aria-label={columnLabel(column)}
                triggerClassName={DATA_TABLE_STYLES.selectTrigger}
                contentClassName={DATA_TABLE_STYLES.selectContent}
                onValueChange={(next) => column.setFilterValue(next === ALL_VALUE ? "" : next)}
            />
        </div>
    );
}

export function DataTableToolbar<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    // フィルタリング可能なカラムを取得
    const filterableColumns = table
        .getAllColumns()
        .filter((column) => column.columnDef.meta?.filterable);

    // 絞り込む列が無い表では行を描かない。空の行でも親の space-y-2 の 8px が残り、
    // カードの見出しの下線から表までが 16px + 8px に開いていた
    if (filterableColumns.length === 0) return null;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
                {filterableColumns.map((column) => {
                    const meta = column.columnDef.meta;
                    if (meta?.filterType === "select") {
                        return <SelectColumnFilter key={column.id} column={column} />;
                    }
                    // テキストフィルター
                    const rawValue = column.getFilterValue();
                    return (
                        <div key={column.id} className="flex flex-col space-y-1">
                            <span className={DATA_TABLE_STYLES.selectLabel}>{columnLabel(column)}</span>
                            <Input
                                placeholder={meta?.filterPlaceholder || "フィルター..."}
                                value={typeof rawValue === "string" ? rawValue : ""}
                                onChange={(event) => column.setFilterValue(event.target.value)}
                                className={DATA_TABLE_STYLES.textInput}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
