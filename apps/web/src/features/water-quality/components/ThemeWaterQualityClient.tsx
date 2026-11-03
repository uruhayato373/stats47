'use client';
import { useState } from 'react';

import { ChartPanel } from '@stats47/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import { WATER_QUALITY_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ExternalAnchor } from "@/components/atoms/ExternalAnchor";
import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

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
  // 県のページはその県の行だけ。全国のページは全国の公式集計の行だけを出す (47 都道府県を並べない。2026-10-31)
  const prefs = selectedPrefectureCode
    ? snapshot.prefectures.filter((p) => p.areaCode === selectedPrefectureCode)
    : [];
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
        description={`2023年度 · ${selectedPrefectureCode ? selectedAreaName : '全国'}`}
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
            if (v === null) return;
            if (waterKinds.includes(v as typeof kind))
              setKind(v as typeof kind);
          }}
          items={waterKinds.map((k) => ({
            value: k,
            label: WATER_QUALITY_SOURCE.kinds[k],
          }))}
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
          水域が達成（{f((national.compliant / national.total) * 100)}%）
        </p>
        {prefs.length > 0 && (
        <ValueTable
          ariaLabel={`${WATER_QUALITY_SOURCE.kinds[kind]}の県別掲載行と達成割合`}
          caption="県別の分母は各県欄の掲載行です。全国の公式水域数とは集計範囲が異なります。"
          columns={[
            { key: 'area', header: '都道府県', rowHeader: true },
            { key: 'compliant', header: '達成 / 掲載行' },
            { key: 'rate', header: '達成割合' },
          ]}
          rows={prefs.map((p) => {
            const s = summarizeWaterRows(snapshot, p.areaCode, kind);
            return {
              key: p.areaCode,
              attrs: { 'data-prefecture-code': p.areaCode, 'data-water-kind': kind },
              cells: [
                p.areaName,
                {
                  content: s.total ? `${f(s.compliant)} / ${f(s.total)}` : '掲載なし',
                  attrs: { 'data-compliant': s.compliant, 'data-total': s.total },
                },
                s.rate === null ? '—' : `${f(s.rate)}%`,
              ],
            };
          })}
        />
        )}
        {selectedPrefectureCode ? (
          rows.length ? (
            <ValueTable
              ariaLabel={`${selectedAreaName}の${WATER_QUALITY_SOURCE.kinds[kind]}原表一覧`}
              caption="濃度の単位はmg/Lです。原表の平均値と75%値の最大値を分けて示します。"
              columns={[
                { key: 'name', header: '水域 / 関係県', rowHeader: true },
                { key: 'class', header: '類型', align: 'left' },
                { key: 'limit', header: '基準値' },
                { key: 'value75', header: '75%値の最大値' },
                { key: 'mean', header: '平均値' },
                { key: 'judge', header: '判定', align: 'left' },
              ]}
              rows={rows.map((r) => ({
                key: r.id,
                attrs: { 'data-water-row': r.id },
                cells: [
                  <>
                    <ExternalAnchor
                      href={`${WATER_QUALITY_SOURCE.url}#page=${r.page}`}
                      className="underline underline-offset-2"
                    >
                      {r.name}
                    </ExternalAnchor>
                    {r.relatedAreaCodes.length > 1 ? (
                      <small className="block">
                        {r.relatedAreaCodes
                          .map(
                            (c) =>
                              snapshot.prefectures.find((p) => p.areaCode === c)
                                ?.areaName
                          )
                          .join('・')}
                      </small>
                    ) : null}
                    {r.id === WATER_QUALITY_SOURCE.anomaly.id ? (
                      <small className="block">類型と基準値に原典間の相違あり</small>
                    ) : null}
                  </>,
                  r.class,
                  r.limit,
                  { content: r.value75, attrs: { 'data-value75': r.value75 } },
                  { content: r.mean, attrs: { 'data-mean': r.mean } },
                  r.compliant ? '達成' : '未達成',
                ],
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              この県欄には選択した種類の水域が掲載されていません。
            </p>
          )
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
          <ExternalAnchor
            href={`${WATER_QUALITY_SOURCE.mainUrl}#page=13`}
            className="underline underline-offset-2"
          >
            全国集計の原表
          </ExternalAnchor>
          {' · '}
          <ExternalAnchor
            href={WATER_QUALITY_SOURCE.anomaly.prefecturalSourceUrl}
            className="underline underline-offset-2"
          >
            香川県の類型確認資料
          </ExternalAnchor>
        </p>
      </ChartPanel>
    </div>
  );
}
