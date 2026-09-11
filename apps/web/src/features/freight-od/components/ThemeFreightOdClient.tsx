'use client';

import { useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
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
import { FREIGHT_OD_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectFreightPartners,
  type FreightOdSnapshot,
} from '../lib/freight-od-snapshot';

export function ThemeFreightOdClient({
  snapshot,
}: {
  snapshot: FreightOdSnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const [modeKey, setModeKey] =
    useState<FreightOdSnapshot['modes'][number]['mode']>('rail');
  const [direction, setDirection] = useState<'outbound' | 'inbound'>(
    'outbound'
  );
  const mode = snapshot.modes.find((item) => item.mode === modeKey)!;
  const partners = selectedPrefectureCode
    ? selectFreightPartners(
        snapshot,
        modeKey,
        selectedPrefectureCode,
        direction
      )
    : null;
  const rows = selectedPrefectureCode
    ? partners?.rows
    : direction === 'outbound'
      ? mode.originTotals
      : mode.destinationTotals;
  const area = selectedPrefectureCode ? selectedAreaName : '全国';
  const period = `2024${mode.periodType === 'fiscal' ? '年度' : '年（暦年）'}`;
  const total = rows?.reduce((sum, row) => sum + row.value, 0) ?? 0;
  return (
    <div
      className="min-w-0"
      data-theme-component-key="freight-od"
      data-data-state={rows ? 'ready' : 'unavailable'}
      data-area-code={selectedPrefectureCode ?? '00000'}
      data-transport-mode={modeKey}
      data-flow-direction={direction}
    >
      <ChartPanel
        title="貨物の発地と着地"
        description={`${period} · ${mode.label} · ${area} · 単位：${mode.unit}`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={FREIGHT_OD_SOURCE.title}
            sourceLink={
              modeKey === 'air'
                ? FREIGHT_OD_SOURCE.files[1].url
                : FREIGHT_OD_SOURCE.files[0].url
            }
          />
        }
      >
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="輸送機関"
        >
          {snapshot.modes.map((item) => (
            <Button
              key={item.mode}
              type="button"
              variant={item.mode === modeKey ? 'default' : 'outline'}
              size="sm"
              aria-pressed={item.mode === modeKey}
              onClick={() => setModeKey(item.mode)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="貨物の方向"
        >
          <Button
            type="button"
            size="sm"
            variant={direction === 'outbound' ? 'default' : 'outline'}
            aria-pressed={direction === 'outbound'}
            onClick={() => setDirection('outbound')}
          >
            発送先を見る
          </Button>
          <Button
            type="button"
            size="sm"
            variant={direction === 'inbound' ? 'default' : 'outline'}
            aria-pressed={direction === 'inbound'}
            onClick={() => setDirection('inbound')}
          >
            到着元を見る
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedPrefectureCode
            ? `${selectedAreaName}${direction === 'outbound' ? 'から発送された貨物の到着先' : 'へ到着した貨物の発送元'}です。自県内の輸送も含みます。`
            : '全国表示は県別の発送・到着合計です。ページ上部で都道府県を選ぶと、相手47県との流動を表示します。'}
        </p>
        {rows ? (
          <Table
            aria-label={`${period} ${mode.label} ${area}の${direction === 'outbound' ? '発送先' : '到着元'}`}
            className="min-w-80"
            containerClassName="min-w-0 max-w-full max-h-96"
          >
            <TableCaption>
              {period}・{mode.label}。単位は{mode.unit}
              。輸送機関をまたいだ合計・構成比は計算しません。
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">
                  {selectedPrefectureCode
                    ? '相手県'
                    : direction === 'outbound'
                      ? '発送県'
                      : '到着県'}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  輸送量（{mode.unit}）
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.areaCode}
                  data-partner-area-code={row.areaCode}
                >
                  <TableHead scope="row">
                    {
                      snapshot.prefectures.find(
                        (pref) => pref.areaCode === row.areaCode
                      )?.areaName
                    }
                    {row.areaCode === selectedPrefectureCode ? '（県内）' : ''}
                  </TableHead>
                  <TableCell
                    className="text-right tabular-nums"
                    data-flow-value={row.value}
                  >
                    {row.value.toLocaleString('ja-JP')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableHead scope="row">表の47県合計</TableHead>
                <TableCell className="text-right tabular-nums">
                  {total.toLocaleString('ja-JP')}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            選択した地域の確認済みデータを取得できません。
          </p>
        )}
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {snapshot.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
