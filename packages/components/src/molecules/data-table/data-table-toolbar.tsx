"use client";

import { Column, Table } from "@tanstack/react-table";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Input } from "../../atoms/ui/input";
import { cn } from "../../lib/cn";

import { DATA_TABLE_STYLES } from "./constants";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
}

interface FilterOption {
    value: string;
    label: string;
}

const ALL_VALUE = "all";
const ALL_LABEL = "すべて";

/**
 * 閉じている間の見た目。SelectTrigger (select.tsx) と同じクラス・data 属性・aria で描く。
 * cn-select-trigger は style-lyra.used.css の抽出対象なので文字列のまま書く。
 */
const SELECT_TRIGGER_CLASS_NAME =
    "cn-select-trigger flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-placeholder:text-muted-foreground data-[size=default]:h-8 dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

type SelectModule = typeof import("../../atoms/ui/select");

/**
 * Select (Base UI) は初回の pointerenter / focus で読み始め、押されたら本物に置き換えて開く (配信サイズ策 D)。
 * 閉じている間は同じ見た目のボタンを描き、表の初回配信に選択肢の JS を載せない。
 * 置き換えは押したときだけにする (hover で置き換えると、押す途中でボタンの要素が入れ替わり押下が失われる)。
 */
let selectRequest: Promise<void> | null = null;
let loadedSelect: SelectModule | null = null;
const selectListeners = new Set<() => void>();

function loadSelect(): void {
    selectRequest ??= import("../../atoms/ui/select").then((loaded) => {
        loadedSelect = loaded;
        selectListeners.forEach((listener) => listener());
    });
}

function subscribeSelect(listener: () => void) {
    selectListeners.add(listener);
    return () => {
        selectListeners.delete(listener);
    };
}

interface LoadedFilterSelectProps {
    select: SelectModule;
    value: string;
    options: readonly FilterOption[];
    onChange: (value: string) => void;
}

/** 押されたあとに描く本物の Select。押した操作の続きとして開いた状態で始める。 */
function LoadedFilterSelect({ select, value, options, onChange }: LoadedFilterSelectProps) {
    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = select;
    return (
        <Select
            value={value}
            defaultOpen
            onValueChange={(next) => {
                if (next !== null) onChange(next);
            }}
            items={[{ value: ALL_VALUE, label: ALL_LABEL }, ...options]}
        >
            <SelectTrigger className={DATA_TABLE_STYLES.selectTrigger}>
                <SelectValue placeholder={ALL_LABEL} />
            </SelectTrigger>
            <SelectContent className={DATA_TABLE_STYLES.selectContent}>
                <SelectItem value={ALL_VALUE}>{ALL_LABEL}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function columnLabel<TData>(column: Column<TData, unknown>): string {
    return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

function SelectColumnFilter<TData>({ column }: { column: Column<TData, unknown> }) {
    const [activated, setActivated] = React.useState(false);
    const select = React.useSyncExternalStore(subscribeSelect, () => loadedSelect, () => null);
    const filterOptions = column.columnDef.meta?.filterOptions;
    const facetedValues = column.getFacetedUniqueValues();

    // filterOptions が指定されている場合はそれを使い、なければ実データのユニーク値を使う。
    // フィルタリングは実際のデータ値に対して行うため、指定された全オプションを表示しても問題ない。
    const options = React.useMemo<FilterOption[]>(() => {
        if (filterOptions) return filterOptions;
        return Array.from(facetedValues.keys())
            .filter((value): value is string => typeof value === "string" && value !== "" && value !== "-")
            .map((value) => ({ value, label: value }));
    }, [filterOptions, facetedValues]);

    const rawValue = column.getFilterValue();
    const value = typeof rawValue === "string" ? rawValue : "";
    const selectedLabel = options.find((option) => option.value === value)?.label;
    const placeholder = (
        <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={false}
            data-slot="select-trigger"
            data-size="default"
            data-placeholder={selectedLabel ? undefined : ""}
            className={cn(SELECT_TRIGGER_CLASS_NAME, DATA_TABLE_STYLES.selectTrigger)}
            onPointerEnter={loadSelect}
            onFocus={loadSelect}
            onClick={() => {
                // 読み込み中に押されたら、読み終わった時点で開いた状態で描く
                setActivated(true);
                loadSelect();
            }}
        >
            <span data-slot="select-value">{selectedLabel ?? ALL_LABEL}</span>
            <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        </button>
    );

    return (
        <div className="flex flex-col space-y-1">
            <span className={DATA_TABLE_STYLES.selectLabel}>{columnLabel(column)}</span>
            {select && activated ? (
                <LoadedFilterSelect
                    select={select}
                    value={value}
                    options={options}
                    onChange={(next) => column.setFilterValue(next === ALL_VALUE ? "" : next)}
                />
            ) : (
                placeholder
            )}
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
