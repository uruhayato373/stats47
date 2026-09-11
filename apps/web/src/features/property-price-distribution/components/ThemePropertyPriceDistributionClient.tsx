'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { PROPERTY_PRICE_DISTRIBUTION_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { PropertyPriceDistributionSnapshot } from '../lib/property-price-distribution-snapshot';

const format = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
const exclusionLabels: Record<string, string> = {
  'other-region': '住宅地以外',
  'other-use': '住宅用地以外',
  'area-missing': '面積欠測',
  'area-censored': '面積に上限等の表記',
  'area-invalid': '面積を判定できない',
  'outside-area-band': '面積帯の対象外',
  'unit-price-missing': '単価欠測',
  'unit-price-censored': '単価に上限等の表記',
  'unit-price-invalid': '単価を判定できない',
  'unit-price-nonpositive': '単価が正でない',
};

export function ThemePropertyPriceDistributionClient({
  snapshot,
}: {
  snapshot: PropertyPriceDistributionSnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const selected = selectedPrefectureCode
    ? snapshot.areas.find((row) => row.areaCode === selectedPrefectureCode)!
    : snapshot.national;
  const area = selectedPrefectureCode ? selectedAreaName : '全国の対象標本';
  const rows = [
    {
      key: 'transactions',
      label: '土地取引',
      distribution: selected.transactions,
    },
    {
      key: 'officialLandPrice',
      label: '地価公示',
      distribution: selected.officialLandPrice,
    },
  ];
  return (
    <div
      data-theme-component-key="property-prices"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="住宅地の価格分布"
        description={`2025年 · ${area} · 公表面積100㎡以上300㎡未満`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source="不動産情報ライブラリ・国土数値情報（地価公示）"
            sourceLink="https://www.reinfolib.mlit.go.jp/"
          />
        }
      >
        <Table aria-label={`${area}の住宅地価格分布`}>
          <TableCaption>
            価格は円/㎡。対象条件に合う公表標本の分布で、県内すべての住宅地の価格ではありません。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">資料</TableHead>
              <TableHead scope="col" className="text-right">
                第1
                <br />
                四分位
              </TableHead>
              <TableHead scope="col" className="text-right">
                中央値
              </TableHead>
              <TableHead scope="col" className="text-right">
                第3
                <br />
                四分位
              </TableHead>
              <TableHead scope="col" className="text-right">
                標本数
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ key, label, distribution: d }) => (
              <TableRow key={key} data-distribution-key={key}>
                <TableHead scope="row">
                  {label}
                  {d.status === 'small-sample' && (
                    <span className="block text-xs font-normal">少数標本</span>
                  )}
                </TableHead>
                <TableCell className="text-right tabular-nums" data-q1={d.q1}>
                  {format(d.q1)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-median={d.median}
                >
                  {format(d.median)}
                </TableCell>
                <TableCell className="text-right tabular-nums" data-q3={d.q3}>
                  {format(d.q3)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-sample-size={d.count}
                >
                  {d.count.toLocaleString('ja-JP')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <details className="text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer">集計対象と除外数</summary>
          {rows.map(({ key, label, distribution: d }) => (
            <div key={key} className="mt-2">
              <p>
                {label}：公表資料{d.rawCount.toLocaleString('ja-JP')}件から
                {d.count.toLocaleString('ja-JP')}件を集計。
              </p>
              <ul>
                {Object.entries(d.excluded)
                  .filter(([, n]) => n > 0)
                  .map(([reason, n]) => (
                    <li key={reason}>
                      {exclusionLabels[reason]}：{n.toLocaleString('ja-JP')}件
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </details>
        <p className="text-xs leading-relaxed text-muted-foreground">
          取引価格は2025年の土地のみの取引、公示価格は2025年1月1日時点の標準地です。同じ土地の比較や時系列の値上がり率ではありません。全国値は対象標本をまとめて集計し、県別中央値を平均していません。
        </p>
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {PROPERTY_PRICE_DISTRIBUTION_SOURCE.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {PROPERTY_PRICE_DISTRIBUTION_SOURCE.sources.map((source, i) => (
            <span key={source.id}>
              {i > 0 && ' / '}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {source.title}
              </a>
            </span>
          ))}
        </p>
      </ChartPanel>
    </div>
  );
}
