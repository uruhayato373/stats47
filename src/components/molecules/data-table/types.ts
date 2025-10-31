import { ColumnDef } from "@tanstack/react-table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  maxRows?: number;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  showIndex?: boolean;
  showBorder?: boolean;
}

export interface DataTableColumnMeta {
  filterable?: boolean;
  filterType?: "text" | "select";
  filterPlaceholder?: string;
  /** セレクトフィルターの選択肢（値とラベルのマッピング） */
  filterOptions?: Array<{ value: string; label: string }>;
  width?: string;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> extends DataTableColumnMeta {}
}
