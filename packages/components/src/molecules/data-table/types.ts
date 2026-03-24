import { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  emptyMessage?: string;
  maxRows?: number;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  showIndex?: boolean;
  showBorder?: boolean;
  /** 行選択を有効にする */
  enableRowSelection?: boolean;
  /** 行の一意ID（enableRowSelection 時は推奨） */
  getRowId?: (row: TData) => string;
  /** 選択行が変わったときのコールバック */
  onSelectionChange?: (selectedRows: TData[]) => void;
  /** デフォルトのソート順 */
  defaultSorting?: SortingState;
  /** デフォルトの列の表示状態 */
  initialColumnVisibility?: VisibilityState;
  /** テーブルのメタデータ（リフレッシュコールバックなど） */
  meta?: Record<string, unknown>;
  /** 行クリック時コールバック */
  onRowClick?: (row: TData) => void;
  /** 行ごとの動的 className */
  rowClassName?: (row: TData) => string | undefined;
  /** ページネーションの総件数ラベルを非表示にする */
  showRowCount?: boolean;
}

export interface DataTableColumnMeta {
  filterable?: boolean;
  filterType?: "text" | "select";
  filterPlaceholder?: string;
  /** セレクトフィルターの選択肢（値とラベルのマッピング） */
  filterOptions?: Array<{ value: string; label: string }>;
  width?: string;
  minWidth?: string;
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> extends DataTableColumnMeta {}
}
