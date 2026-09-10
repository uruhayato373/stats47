'use client';
import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import {
  PUBLIC_FACILITY_BAND_LABELS,
  PUBLIC_FACILITY_GROUPS,
  PUBLIC_FACILITY_LIMIT,
  publicFacilityNationalValues,
  type PublicFacilityGroup,
} from '../lib/geo-public-facility-evidence';

import type { GeoAnalysisSnapshot } from '@stats47/gis';

const slug = 'population-public-facility-access';
const people = (value: number | null | undefined) =>
  typeof value === 'number'
    ? `${Math.round(value).toLocaleString('ja-JP')}人`
    : '—';
const share = (value: number | null | undefined) =>
  typeof value === 'number' ? `${value.toFixed(1)}%` : '算出不可';

export function GeoPublicFacilitySummary({
  snapshot,
  selectedAreaCode,
  onSelectArea,
}: {
  snapshot: GeoAnalysisSnapshot;
  selectedAreaCode?: string | null;
  onSelectArea?: (code: string, name: string) => void;
}) {
  const [group, setGroup] = useState<PublicFacilityGroup>('administrative');
  const [year, setYear] = useState<'2020' | '2050'>('2020');
  const national = useMemo(
    () => publicFacilityNationalValues(snapshot.rows),
    [snapshot]
  );
  const selected = snapshot.rows.find(
    (row) => row.areaCode === selectedAreaCode
  );
  const values = selected?.values ?? national;
  const rows = selected
    ? [selected]
    : [...snapshot.rows].sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  return (
    <SurfaceSection>
      <SectionHeader
        title={
          selected
            ? `${selected.areaName}の公共施設への距離帯別人口`
            : '全国と47都道府県の公共施設への距離帯別人口'
        }
        hideRule
      />
      <div className="my-4 flex flex-col gap-3 sm:flex-row">
        <Select
          value={group}
          onValueChange={(value) => {
            if (value === 'administrative' || value === 'meeting')
              setGroup(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-80" aria-label="集計の施設群">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PUBLIC_FACILITY_GROUPS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={year}
          onValueChange={(value) => {
            if (value === '2020' || value === '2050') setYear(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="集計の人口年">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2020">2020年人口</SelectItem>
            <SelectItem value="2050">2050年推計人口</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm font-medium">
        {selected?.areaName ?? '全国（47都道府県の合算）'}・
        {PUBLIC_FACILITY_GROUPS[group]}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        施設数 {Number(values[`${group}FacilityCount`]).toLocaleString('ja-JP')}
        件（2022年4月）。行政施設と公的集会施設は同じ人口をそれぞれ分類します。両群の人口は合算しません。
      </p>
      <div className="mt-3 min-w-0 overflow-x-auto">
        <Table aria-label="選択地域の距離帯別人口と比率">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">最寄り施設への距離帯</TableHead>
              <TableHead scope="col" className="text-right">
                {year}年人口
              </TableHead>
              <TableHead scope="col" className="text-right">
                比率
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PUBLIC_FACILITY_BAND_LABELS.map((label, band) => (
              <TableRow key={label}>
                <TableHead scope="row" className="whitespace-nowrap">
                  {label}
                </TableHead>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {people(values[`${group}Band${band}Population${year}`])}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {share(values[`${group}Band${band}Share${year}`])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        分母：{people(values[`population${year}`])}
        。全国比率は人口の合算から計算します。表示時に丸めるため、比率の合計が100%にならない場合があります。
      </p>
      <div className="mt-5 min-w-0 overflow-x-auto">
        <Table aria-label="47都道府県の距離帯別人口">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">都道府県</TableHead>
              {PUBLIC_FACILITY_BAND_LABELS.map((label) => (
                <TableHead
                  key={label}
                  scope="col"
                  className="text-right whitespace-nowrap"
                >
                  {label}
                </TableHead>
              ))}
              <TableHead scope="col">検算</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.areaCode}>
                <TableHead scope="row" className="whitespace-nowrap">
                  {onSelectArea && !selected ? (
                    <Button
                      variant="link"
                      className="h-11 p-0"
                      onClick={() => onSelectArea(row.areaCode, row.areaName)}
                      aria-label={`${row.areaName}の公共施設地図を表示`}
                    >
                      {row.areaName}
                    </Button>
                  ) : (
                    <Link
                      className="inline-flex min-h-11 items-center text-primary underline"
                      href={`/geo/${slug}/${row.areaCode.slice(0, 2)}/overlap`}
                    >
                      {row.areaName}
                    </Link>
                  )}
                </TableHead>
                {PUBLIC_FACILITY_BAND_LABELS.map((label, band) => (
                  <TableCell
                    key={label}
                    className="text-right whitespace-nowrap tabular-nums"
                  >
                    {people(row.values[`${group}Band${band}Population${year}`])}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {share(row.values[`${group}Band${band}Share${year}`])}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap">
                  <Link
                    className="inline-flex min-h-11 items-center text-primary underline"
                    href={`/geo/data/${slug}/${row.areaCode.slice(0, 2)}`}
                  >
                    地点・検算
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {PUBLIC_FACILITY_LIMIT}
      </p>
      <nav
        aria-label="公共施設アクセスの出典"
        className="mt-3 flex flex-wrap gap-4 text-sm text-primary underline"
      >
        <Link href={`/geo/${slug}`}>分析詳細</Link>
        <Link href={`/geo/${slug}#methods`}>一次資料・取得記録・判定方法</Link>
      </nav>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {snapshot.sources.map((source) => (
          <li key={`${source.datasetId}-${source.version}`}>
            <a
              className="text-primary underline"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.name}
            </a>
            （{source.license}）
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        国土数値情報をもとにstats47が空間演算・集計。取得記録と対象版は分析詳細・検算データで確認できます。
      </p>
    </SurfaceSection>
  );
}
