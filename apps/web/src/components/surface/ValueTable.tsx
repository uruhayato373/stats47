import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

export interface ValueTableColumn {
  key: string;
  header: ReactNode;
  /** 1 列目以外は右寄せ・桁そろえの数値の列。文字の列だけ 'left' を指定する */
  align?: 'left';
  /** 行の見出しの列 (セルを th scope="row" で描く)。1 表に 1 列まで */
  rowHeader?: boolean;
  /** 列に足す class (幅の指定など) */
  className?: string;
}

interface ValueTableCellObject {
  content: ReactNode;
  attrs?: HTMLAttributes<HTMLTableCellElement> & Record<`data-${string}`, unknown>;
}

/** セルの中身。data-* などの属性が要るときは { content, attrs } で渡す */
export type ValueTableCell = ReactNode | ValueTableCellObject;

export interface ValueTableRow {
  key: string;
  /** columns と同じ数・同じ順のセル */
  cells: readonly ValueTableCell[];
  /** 行に付ける属性 (data-* など) */
  attrs?: Record<`data-${string}`, unknown>;
  /** 合計などの締めの行 (上に線・太字) */
  total?: boolean;
}

interface ValueTableProps {
  columns: readonly ValueTableColumn[];
  rows: readonly ValueTableRow[];
  /** 表の名前 (読み上げ・横スクロールの領域名) */
  ariaLabel?: string;
  /** 表の下の注記 */
  caption?: ReactNode;
  /** 幅を絞って横スクロールさせる表 (キーボードでスクロールできる領域にする) */
  scrollRegion?: boolean;
  /** 項目と値の対だけの表で、見出しの行を画面に出さない (読み上げには残す) */
  hideHeader?: boolean;
  /** 横・縦スクロールを担う外側の箱に足す class (長い一覧の高さを抑える max-h-96 など) */
  containerClassName?: string;
  className?: string;
}

/**
 * 行の多いページの重さのため、行ごとの class を繰り返さず表に 1 回だけ書く
 * (市区町村ページは 200 行を超え、HTML と RSC の両方に class が載る。2026-10-22 に札幌市のページが予算 900KB を超えた)。
 * `<small>` は補足 (年・割合など)、行の見出しのリンクは指標名・地域名。
 */
const VALUE_TABLE_CLASS =
  '[&_td:not(:first-child)]:text-right [&_td:not(:first-child)]:tabular-nums ' +
  '[&_thead_th:not(:first-child)]:text-right ' +
  '[&_small]:text-[11px] [&_small]:text-muted-foreground ' +
  '[&_th_a]:font-medium [&_th_a]:text-foreground [&_th_a:hover]:text-primary [&_th_a:hover]:underline ' +
  '[&_td_a]:text-foreground [&_td_a:hover]:text-primary [&_td_a:hover]:underline';

function isCellObject(cell: ValueTableCell): cell is ValueTableCellObject {
  return typeof cell === 'object' && cell !== null && !Array.isArray(cell) && 'content' in (cell as object);
}

/**
 * サイトの静的な表 (2026-11-03)。並べ替え・絞り込みの要らない表はすべてこの部品で描く
 * (要る表は DataTable)。見出しの行は表の部品の既定のまま (背景や文字の大きさをページで上書きしない)、
 * 1 列目以外は右寄せ・桁そろえ (文字の列だけ align: 'left')、行の見出しは th scope="row"。枠は持たず、置く場所 (章の格子・ChartPanel など) が決める。
 * 正典: 部品の台帳 data/design/components.json の value-table。
 */
export function ValueTable({ columns, rows, ariaLabel, caption, scrollRegion = false, hideHeader = false, containerClassName, className }: ValueTableProps) {
  if (rows.length === 0) return null;
  return (
    <Table
      aria-label={ariaLabel}
      scrollRegion={scrollRegion}
      containerClassName={containerClassName}
      className={cn(VALUE_TABLE_CLASS, className)}
    >
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader className={cn(hideHeader && 'sr-only')}>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              scope="col"
              className={cn(column.align === 'left' && 'text-left!', column.className)}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key} className={cn(row.total && 'border-t-2 font-medium')} {...row.attrs}>
            {columns.map((column, index) => {
              const cell = row.cells[index];
              const content: ReactNode = isCellObject(cell) ? cell.content : (cell as ReactNode);
              const attrs = isCellObject(cell) ? cell.attrs : undefined;
              const className = cn(column.align === 'left' && 'text-left!', column.className);
              return column.rowHeader ? (
                <TableHead key={column.key} scope="row" className={cn('whitespace-normal!', className)} {...attrs}>
                  {content}
                </TableHead>
              ) : (
                <TableCell key={column.key} className={className} {...attrs}>
                  {content}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
