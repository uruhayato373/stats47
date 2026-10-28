import type { ComponentProps } from "react";

import { DataGridClient, type GridColumn, type GridRow } from "./data-grid-client";

export type { GridColumn, GridRow };

/**
 * DataGrid の入口 (サーバーでもクライアントでも使える)。セルの配列を番号付きのオブジェクトに変えてから
 * クライアント部品へ渡す。要素の配列をそのまま渡すと、React がサーバーからの受け渡しで「リスト」とみなし
 * key の無い要素に警告を出すため (2026-10-27 /ops/workflows で実測)。
 */
export function DataGrid({ rows, ...props }: Omit<ComponentProps<typeof DataGridClient>, "rows"> & { rows: GridRow[] }) {
  return <DataGridClient rows={rows.map((r) => ({ ...r, cells: { ...r.cells } }))} {...props} />;
}
