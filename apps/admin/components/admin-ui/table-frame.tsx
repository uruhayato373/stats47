import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/cn";

/**
 * 表の外枠 (見本 shadcndashboard.dev の表と同じ: 1px 枠・角なし。見出し行は塗らず muted の 14px、セルの余白は 12px × 16px)。
 * 表だけの画面では Card で囲まない。区画が並ぶ画面では PanelCard の中に置く (その場合も枠はこれ)。
 * 行・セルは shadcn の TableHeader / TableRow / TableHead / TableCell をそのまま使う (ここで再輸出する)。
 */
export function TableFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden border", className)}>
      <Table>{children}</Table>
    </div>
  );
}

/** 行が 0 件のときの 1 行 (列数を渡す)。 */
export function EmptyRow({ colSpan, children = "データなし" }: { colSpan: number; children?: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-16 text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}

/** 見本と同じ見出しセル・本文セルの形。TableHead / TableCell の className に足す (DataTable・DataGrid が使う)。 */
export const headCell = "h-auto px-4 py-3 text-sm font-normal text-muted-foreground";
export const bodyCell = "px-4 py-3";

/** 数値の列 (右寄せ・桁ぞろえ)。TableHead / TableCell の className に足す。 */
export const numCol = "text-right tabular-nums";

export { TableBody, TableCell, TableHead, TableHeader, TableRow };
