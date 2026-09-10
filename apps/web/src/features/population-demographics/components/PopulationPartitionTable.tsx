import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import { formatPopulationCount as format } from '../lib/population-profile-view';

export function PopulationPartitionTable({
  areaName,
  category,
  unit,
  rows,
  total,
}: {
  areaName: string;
  category: string;
  unit: string;
  rows: { code: string; label: string; value: number; share: number | null }[];
  total: number;
}) {
  return (
    <Table
      aria-label={`${areaName}の${category}別内訳`}
      className="min-w-96"
      containerClassName="min-w-0 max-w-full"
    >
      <TableCaption>
        構成割合の分母は、選択した地域・男女の総数{format(total)}
        {unit}
        です。不詳を含めた全区分を表示し、割合は小数第2位まで丸めています。
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{category}</TableHead>
          <TableHead scope="col" className="text-right">
            {unit === '世帯' ? '世帯数' : '人口'}（{unit}）
          </TableHead>
          <TableHead scope="col" className="text-right">
            構成割合（%）
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.code} data-category-code={row.code}>
            <TableHead scope="row" className="min-w-40 whitespace-normal">
              {row.label}
            </TableHead>
            <TableCell
              className="text-right tabular-nums"
              data-count={row.value}
            >
              {format(row.value)}
            </TableCell>
            <TableCell
              className="text-right tabular-nums"
              data-share={row.share ?? undefined}
            >
              {row.share === null ? '—' : format(row.share, 2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">合計</TableHead>
          <TableCell className="text-right tabular-nums" data-total={total}>
            {format(total)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {total === 0 ? '—' : '100'}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
