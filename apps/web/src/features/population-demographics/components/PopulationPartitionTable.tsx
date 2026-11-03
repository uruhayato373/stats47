import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { ValueTable } from '@/components/surface';

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
    <ValueTable
      ariaLabel={`${areaName}の${category}別内訳`}
      className="min-w-96"
      scrollRegion
      caption={
        <>
          構成割合の分母は、選択した地域・男女の総数{format(total)}
          {formatUnitForDisplay(unit)}
          です。不詳を含めた全区分を表示し、割合は小数第2位まで丸めています。
        </>
      }
      columns={[
        { key: 'category', header: category, rowHeader: true, className: 'min-w-40' },
        {
          key: 'count',
          header: `${unit === '世帯' ? '世帯数' : '人口'}（${formatUnitForDisplay(unit)}）`,
        },
        { key: 'share', header: '構成割合（%）' },
      ]}
      rows={[
        ...rows.map((row) => ({
          key: row.code,
          attrs: { 'data-category-code': row.code },
          cells: [
            row.label,
            { content: format(row.value), attrs: { 'data-count': row.value } },
            {
              content: row.share === null ? '—' : format(row.share, 2),
              attrs: { 'data-share': row.share ?? undefined },
            },
          ],
        })),
        {
          key: 'total',
          total: true,
          cells: [
            '合計',
            { content: format(total), attrs: { 'data-total': total } },
            total === 0 ? '—' : '100',
          ],
        },
      ]}
    />
  );
}
