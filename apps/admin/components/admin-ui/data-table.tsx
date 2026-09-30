import type { ComponentProps, ReactNode } from "react";

import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/cn";

import { TableFrame } from "./table-frame";

/**
 * 見出し行つきの表。`columns` (列見出し) + 行 (`Row` / `Cell`) で書ける。旧 `ops/primitives` の Table / Tr / Td と同じ書き味で、
 * 中身は shadcn の Table 部品 (TableFrame + TableHeader/TableRow/TableHead/TableCell)。行が長い文を含む一覧向けに、
 * セルは上揃え・折り返し可 (`nowrap` で折り返さない、`muted` で補足の色)。
 */
export function DataTable({ columns, children, className }: { columns: string[]; children: ReactNode; className?: string }) {
  return (
    <TableFrame className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column} className="text-xs text-muted-foreground">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </TableFrame>
  );
}

export const Row = TableRow;

export function Cell({ nowrap, muted, className, ...props }: ComponentProps<typeof TableCell> & { nowrap?: boolean; muted?: boolean }) {
  return (
    <TableCell
      className={cn("align-top whitespace-normal", nowrap && "whitespace-nowrap", muted && "text-muted-foreground", className)}
      {...props}
    />
  );
}
