'use client';
import { useState } from 'react';

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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { WATER_QUALITY_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  summarizeWaterRows,
  waterKinds,
  type WaterQualitySnapshot,
} from '../lib/water-quality-snapshot';
const f = (n: number) =>
  n.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
export function ThemeWaterQualityClient({
  snapshot,
}: {
  snapshot: WaterQualitySnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const [kind, setKind] = useState<(typeof waterKinds)[number]>('river');
  const national = snapshot.national[kind];
  const prefs = selectedPrefectureCode
    ? snapshot.prefectures.filter((p) => p.areaCode === selectedPrefectureCode)
    : snapshot.prefectures;
  const rows = selectedPrefectureCode
    ? summarizeWaterRows(snapshot, selectedPrefectureCode, kind).rows
    : [];
  return (
    <div
      data-theme-component-key="water-quality"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="水域ごとの水質と基準達成"
        description={`2023年度 · ${selectedPrefectureCode ? selectedAreaName : '全国・47都道府県'}`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={WATER_QUALITY_SOURCE.title}
            sourceLink={WATER_QUALITY_SOURCE.url}
          />
        }
      >
        <Select
          value={kind}
          onValueChange={(v) => {
            if (waterKinds.includes(v as typeof kind))
              setKind(v as typeof kind);
          }}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="水域の種類">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {waterKinds.map((k) => (
              <SelectItem key={k} value={k}>
                {WATER_QUALITY_SOURCE.kinds[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm" data-national-kind={kind}>
          全国の公式集計：{f(national.compliant)} / {f(national.total)}
          水域が達成（{f((national.compliant / national.total) * 100)}％）
        </p>
        <Table
          aria-label={`${WATER_QUALITY_SOURCE.kinds[kind]}の県別掲載行と達成割合`}
        >
          <TableCaption>
            県別の分母は各県欄の掲載行です。全国の公式水域数とは集計範囲が異なります。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">都道府県</TableHead>
              <TableHead scope="col" className="text-right">
                達成 / 掲載行
              </TableHead>
              <TableHead scope="col" className="text-right">
                達成割合
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prefs.map((p) => {
              const s = summarizeWaterRows(snapshot, p.areaCode, kind);
              return (
                <TableRow
                  key={p.areaCode}
                  data-prefecture-code={p.areaCode}
                  data-water-kind={kind}
                >
                  <TableHead scope="row">{p.areaName}</TableHead>
                  <TableCell
                    className="text-right tabular-nums"
                    data-compliant={s.compliant}
                    data-total={s.total}
                  >
                    {s.total ? `${f(s.compliant)} / ${f(s.total)}` : '掲載なし'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.rate === null ? '—' : `${f(s.rate)}％`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {selectedPrefectureCode ? (
          <Table
            aria-label={`${selectedAreaName}の${WATER_QUALITY_SOURCE.kinds[kind]}原表一覧`}
          >
            <TableCaption>
              {rows.length
                ? `濃度の単位はmg/Lです。原表の平均値と75％値の最大値を分けて示します。`
                : 'この県欄には選択した種類の水域が掲載されていません。'}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">水域 / 関係県</TableHead>
                <TableHead scope="col">類型</TableHead>
                <TableHead scope="col" className="text-right">
                  基準値
                </TableHead>
                <TableHead scope="col" className="text-right">
                  75％値の最大値
                </TableHead>
                <TableHead scope="col" className="text-right">
                  平均値
                </TableHead>
                <TableHead scope="col">判定</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-water-row={r.id}>
                  <TableHead scope="row">
                    <a
                      href={`${WATER_QUALITY_SOURCE.url}#page=${r.page}`}
                      className="underline underline-offset-2"
                    >
                      {r.name}
                    </a>
                    {r.relatedAreaCodes.length > 1 ? (
                      <span className="block text-xs text-muted-foreground">
                        {r.relatedAreaCodes
                          .map(
                            (c) =>
                              snapshot.prefectures.find((p) => p.areaCode === c)
                                ?.areaName
                          )
                          .join('・')}
                      </span>
                    ) : null}
                    {r.id === WATER_QUALITY_SOURCE.anomaly.id ? (
                      <span className="block text-xs text-muted-foreground">
                        類型と基準値に原典間の相違あり
                      </span>
                    ) : null}
                  </TableHead>
                  <TableCell>{r.class}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.limit}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-value75={r.value75}
                  >
                    {r.value75}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-mean={r.mean}
                  >
                    {r.mean}
                  </TableCell>
                  <TableCell>{r.compliant ? '達成' : '未達成'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            都道府県を選ぶと、水域名・類型・濃度・達成判定と原表へのリンクを確認できます。
          </p>
        )}
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {snapshot.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="text-xs">
          <a
            href={`${WATER_QUALITY_SOURCE.mainUrl}#page=13`}
            className="underline underline-offset-2"
          >
            全国集計の原表
          </a>
          {' · '}
          <a
            href={WATER_QUALITY_SOURCE.anomaly.prefecturalSourceUrl}
            className="underline underline-offset-2"
          >
            香川県の類型確認資料
          </a>
        </p>
      </ChartPanel>
    </div>
  );
}
