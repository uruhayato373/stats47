import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import Link from '@/components/atoms/SiteLink';

export interface MetricRowTableRow {
  key: string;
  /** 指標名 (ランキングのページへのリンクになる) */
  label: ReactNode;
  href: string;
  /** 指標名の下に小さく添える年 */
  year?: string;
  /** 表示用に整形した値 (桁の決め方は呼び出し側の指標ごとの規則に従う) */
  value: string;
  unit?: string;
  /** 3 列目以降のセル (順位・全国の値・全国との差など)。extraHeaders と同じ数・同じ順 */
  cells?: readonly ReactNode[];
  /** 計測の data-nav-label */
  navLabel?: string;
}

interface MetricRowTableProps {
  /** 3 列目以降の見出し (指標・値の後ろ) */
  extraHeaders?: readonly string[];
  rows: readonly MetricRowTableRow[];
  className?: string;
}

/**
 * 表の行ごとに同じ class を繰り返さず、表に 1 回だけ書く (市区町村ページは 200 行を超え、HTML と RSC の
 * 両方に class が載るため。2026-10-22 に札幌市のページが 954KB でページの重さの予算 900KB を超えた)。
 * 2 列目以降は右寄せの数値、`<small>` は補足、1 列目のリンクは指標名。
 */
const METRIC_ROW_TABLE_CLASS =
  '[&_td+td]:whitespace-nowrap [&_td+td]:text-right [&_td+td]:tabular-nums ' +
  '[&_small]:text-[11px] [&_small]:text-muted-foreground ' +
  '[&_td>a]:font-medium [&_td>a]:text-foreground [&_td>a:hover]:text-primary [&_td>a:hover]:underline';

/**
 * 1 つの地域の指標を 1 行ずつ「指標 (年) ・値・呼び出し側の列 (順位・全国との差など)」で並べる表 (2026-11-03)。
 * 市区町村のデータブックとテーマの品目の多いグループ (view "table") が同じ部品を使う。
 * 47 都道府県を並べる表ではない (地域どうしの比較はランキングのページ)。順位は表の中なので文字のまま書く (RankBadge にしない)。
 * 枠は持たない。呼び出し側が ChartPanel などの枠に入れる。
 */
export function MetricRowTable({ extraHeaders = [], rows, className }: MetricRowTableProps) {
  if (rows.length === 0) return null;
  return (
    <Table className={cn(METRIC_ROW_TABLE_CLASS, className)}>
      <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
        <TableRow>
          <TableHead>指標</TableHead>
          <TableHead className="text-right!">値</TableHead>
          {extraHeaders.map((header) => (
            <TableHead key={header} className="text-right!">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="min-w-40">
              <Link href={row.href} data-nav-label={row.navLabel}>
                {row.label}
              </Link>
              {row.year && <small className="block">{row.year}</small>}
            </TableCell>
            <TableCell>
              {row.value}
              {row.unit && <small className="ml-0.5">{row.unit}</small>}
            </TableCell>
            {row.cells?.map((cell, index) => (
              <TableCell key={extraHeaders[index] ?? index}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
