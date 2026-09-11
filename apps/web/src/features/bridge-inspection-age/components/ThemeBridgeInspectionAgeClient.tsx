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
import { BRIDGE_INSPECTION_AGE_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { BridgeInspectionAgeSnapshot } from '../lib/bridge-inspection-age-snapshot';

export function ThemeBridgeInspectionAgeClient({
  snapshot,
}: {
  snapshot: BridgeInspectionAgeSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const selected = selectedPrefectureCode
    ? snapshot.areas.find((a) => a.areaCode === selectedPrefectureCode)
    : snapshot.national;
  const area = selectedPrefectureCode
    ? snapshot.areas.find((a) => a.areaCode === selectedPrefectureCode)
        ?.areaName
    : '全国';
  if (!selected || !area)
    return <p role="status">この地域の架設年度データはありません。</p>;
  return (
    <div
      data-theme-component-key="bridge-inspection-age"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="当年度点検橋の架設年度分布"
        description={`${snapshot.year}年度点検 · ${area} · 年度末時点で診断中の施設を除く`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source="国土交通省「道路メンテナンス年報」施設名一覧をstats47が集計"
            sourceLink={SOURCE.indexUrl}
          />
        }
      >
        <p
          className="text-sm"
          data-published-count={selected.publishedCount}
          data-known-year-count={selected.knownYearCount}
          data-unknown-year-count={selected.unknownYearCount}
        >
          掲載橋数 {selected.publishedCount.toLocaleString('ja-JP')}
          橋のうち、架設年度が分かる橋は
          {selected.knownYearCount.toLocaleString('ja-JP')}橋、不明は
          {selected.unknownYearCount.toLocaleString('ja-JP')}橋です。
        </p>
        <Table aria-label={`${area}の当年度点検橋の架設年度分布`}>
          <TableCaption>
            年度差＝2025年度−架設年度。割合は架設年度不明を含む掲載橋数が分母です。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                架設年度
                <br />
                （西暦）
              </TableHead>
              <TableHead scope="col" className="text-right">
                年度差
              </TableHead>
              <TableHead scope="col" className="text-right">
                橋数
              </TableHead>
              <TableHead scope="col" className="text-right">
                割合
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SOURCE.bands.map((band) => {
              const count = selected.bands.find(
                (b) => b.key === band.key
              )!.count;
              const share =
                selected.publishedCount === 0
                  ? null
                  : (count / selected.publishedCount) * 100;
              return (
                <TableRow key={band.key} data-band-key={band.key}>
                  <TableHead scope="row">{band.constructionLabel}</TableHead>
                  <TableCell className="text-right whitespace-nowrap">
                    {band.label}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-count={count}
                  >
                    {count.toLocaleString('ja-JP')}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums whitespace-nowrap"
                    data-share={share}
                    data-denominator={selected.publishedCount}
                  >
                    {share === null ? '—' : `${share.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          管理者別の掲載数：国土交通省{' '}
          {selected.managerCounts.mlit.toLocaleString('ja-JP')}橋、高速道路会社{' '}
          {selected.managerCounts.highway.toLocaleString('ja-JP')}
          橋、地方公共団体{' '}
          {selected.managerCounts.local.toLocaleString('ja-JP')}
          橋。割合は表示時に丸めるため合計100%にならない場合があります。
        </p>
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {SOURCE.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          原表（XLSX）：
          {SOURCE.sources.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' / '}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {s.title}
              </a>
            </span>
          ))}
        </p>
      </ChartPanel>
    </div>
  );
}
