'use client';

import { useState } from 'react';

import { ChartPanel } from '@stats47/components';
import { FREIGHT_OD_SOURCE } from '@stats47/data-configs/theme-catalog';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { ChartFooter } from '@/components/charts/ChartFooter';
import { SingleSelectToggleGroup } from '@/components/molecules/SingleSelectToggleGroup';
import { ValueTable } from '@/components/surface';

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
        description={`${period} · ${mode.label} · ${area} · 単位：${formatUnitForDisplay(mode.unit)}`}
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
        <SingleSelectToggleGroup
          aria-label="輸送機関"
          value={modeKey}
          onValueChange={setModeKey}
          options={snapshot.modes.map(item => ({ value: item.mode, label: item.label }))}
        />
        <SingleSelectToggleGroup
          aria-label="貨物の方向"
          value={direction}
          onValueChange={setDirection}
          options={[
            { value: 'outbound', label: '発送先を見る' },
            { value: 'inbound', label: '到着元を見る' },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          {selectedPrefectureCode
            ? `${selectedAreaName}${direction === 'outbound' ? 'から発送された貨物の到着先' : 'へ到着した貨物の発送元'}です。自県内の輸送も含みます。`
            : `全国の${direction === 'outbound' ? '発送' : '到着'}の合計は ${total.toLocaleString('ja-JP')} ${formatUnitForDisplay(mode.unit)}です。県のページでは、その県と相手の県との流動を表示します。`}
        </p>
        {/* 全国のページは合計だけ。県別の合計を 47 行並べない (2026-10-31。比較はランキング) */}
        {!selectedPrefectureCode && rows ? null : rows ? (
          <ValueTable
            ariaLabel={`${period} ${mode.label} ${area}の${direction === 'outbound' ? '発送先' : '到着元'}`}
            className="min-w-80"
            scrollRegion
            containerClassName="min-w-0 max-w-full max-h-96"
            caption={
              <>
                {period}・{mode.label}。単位は{formatUnitForDisplay(mode.unit)}
                。輸送機関をまたいだ合計・構成比は計算しません。
              </>
            }
            columns={[
              {
                key: 'partner',
                header: selectedPrefectureCode ? '相手県' : direction === 'outbound' ? '発送県' : '到着県',
                rowHeader: true,
              },
              { key: 'value', header: `輸送量（${formatUnitForDisplay(mode.unit)}）` },
            ]}
            rows={[
              ...rows.map((row) => ({
                key: row.areaCode,
                attrs: { 'data-partner-area-code': row.areaCode },
                cells: [
                  <>
                    {snapshot.prefectures.find((pref) => pref.areaCode === row.areaCode)?.areaName}
                    {row.areaCode === selectedPrefectureCode ? '（県内）' : ''}
                  </>,
                  { content: row.value.toLocaleString('ja-JP'), attrs: { 'data-flow-value': row.value } },
                ],
              })),
              { key: 'total', total: true, cells: ['表の47県合計', total.toLocaleString('ja-JP')] },
            ]}
          />
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
