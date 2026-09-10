'use client';
import Link from 'next/link';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { LANDSLIDE_EXPOSURE_SOURCE as S } from '@stats47/data-configs/theme-catalog';
import {
  landslideNationalValues,
  type GeoAnalysisSnapshot,
} from '@stats47/gis';

import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';
const number = (n: number | null | undefined) =>
  typeof n === 'number'
    ? n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
    : '対象外';
export function GeoLandslideSummary({
  snapshot,
  selectedAreaCode,
  onSelectArea,
}: {
  snapshot: GeoAnalysisSnapshot;
  selectedAreaCode?: string | null;
  onSelectArea?: (code: string, name: string) => void;
}) {
  const selected = snapshot.rows.find((r) => r.areaCode === selectedAreaCode),
    rows = [...snapshot.rows].sort((a, b) =>
      a.areaCode.localeCompare(b.areaCode)
    );
  const national = {
    areaCode: 'all',
    areaName: '対象46県計（京都府除外）',
    values: landslideNationalValues(snapshot.rows),
  };
  const shown = selected ? [selected] : [national, ...rows];
  return (
    <SurfaceSection data-landslide-summary>
      <SectionHeader
        title={
          selected
            ? `${selected.areaName}の指定区域面と人口・公共施設`
            : '土砂災害の指定区域面と人口・公共施設'
        }
        hideRule
      />
      <p className="text-sm text-muted-foreground">
        指定済み区域面に中心がある250mメッシュ人口（2020年基準）と、原典施設地点（2022年）を照合しています。
      </p>
      {selected?.areaCode === '26000' ? (
        <p role="status" className="mt-3 text-sm">
          京都府はA33-25の商用利用制限により集計対象外です。人口・施設の曝露が0という意味ではありません。
        </p>
      ) : null}
      <div
        className="mt-4 min-w-0 overflow-x-auto"
        tabIndex={0}
        aria-label="人口と施設の表。横方向にスクロールできます"
      >
        <Table aria-label="指定区域面と人口・公共施設の県別集計">
          <TableHeader>
            <TableRow>
              <TableHead>地域</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                区域面の和集合
                <br />
                中心人口（人）
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                人口分母（人）
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                割合
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                市町村役場等
                <br />
                区域内／全体
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                公的集会施設
                <br />
                区域内／全体
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => {
              const v = r.values,
                share =
                  typeof v.exposedCenterPopulation === 'number' &&
                  typeof v.population2020 === 'number' &&
                  v.population2020 > 0
                    ? (v.exposedCenterPopulation / v.population2020) * 100
                    : null;
              return (
                <TableRow key={r.areaCode} data-area-code={r.areaCode}>
                  <TableHead scope="row" className="whitespace-nowrap">
                    {onSelectArea && r.areaCode !== 'all' ? (
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => onSelectArea(r.areaCode, r.areaName)}
                      >
                        {r.areaName}
                      </Button>
                    ) : (
                      r.areaName
                    )}
                  </TableHead>
                  <TableCell className="text-right tabular-nums">
                    {number(v.exposedCenterPopulation)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {number(v.population2020)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {share === null ? '対象外' : `${share.toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {r.areaCode === '26000'
                      ? '対象外'
                      : `${number(v.exposedAdministrativeFacilities)}／${number(v.administrativeFacilities)}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {r.areaCode === '26000'
                      ? '対象外'
                      : `${number(v.exposedMeetingFacilities)}／${number(v.meetingFacilities)}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {selected && selected.areaCode !== '26000' ? (
        <p className="mt-3 text-xs text-muted-foreground">
          警戒区域面の中心人口 {number(selected.values.warningCenterPopulation)}{' '}
          人／特別警戒区域面の中心人口{' '}
          {number(selected.values.specialCenterPopulation)}{' '}
          人。重複するため合算できません。
        </p>
      ) : null}
      <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
        {S.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {[S.a33, S.population, S.facilities].map((s) => (
          <a
            key={s.datasetId}
            href={s.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {s.title}
          </a>
        ))}
        <Link href={`/geo/${S.slug}`} className="text-primary underline">
          計算入力・県別途中データ・保存則を確認
        </Link>
      </div>
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        {S.prefectures
          .filter((p) => !selected || p.areaCode === selected.areaCode)
          .map((p) => (
            <p key={p.areaCode}>
              {p.areaName} 原典時点：{p.dataDate}。{p.attribution}{' '}
              {p.conditions}
            </p>
          ))}
      </div>
    </SurfaceSection>
  );
}
