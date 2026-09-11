'use client';

import { useState } from 'react';

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

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectMigrationView,
  SEX_LABELS,
  formatPopulationCount as format,
  type PopulationSex,
} from '../lib/population-profile-view';

import {
  PopulationProfileSelect,
  PopulationSexSelect,
} from './PopulationProfileControls';

import type { MigrationDemographicsProfile } from '@stats47/data-configs/theme-catalog';

export function ThemeMigrationDemographicsClient({
  snapshot,
}: {
  snapshot: MigrationDemographicsProfile;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const [sex, setSex] = useState<PopulationSex>('0');
  const [ageCode, setAgeCode] = useState('000');
  const [partnerCode, setPartnerCode] = useState('all');
  const activePartner =
    partnerCode === selectedPrefectureCode ? 'all' : partnerCode;
  const view = selectMigrationView(
    snapshot,
    selectedPrefectureCode,
    sex,
    ageCode,
    activePartner
  );
  if (!view)
    return (
      <ChartPanel title="年齢・男女別の県間移動">
        <p role="status" className="text-sm text-muted-foreground">
          選択した条件の確認済みデータを取得できません。
        </p>
      </ChartPanel>
    );
  const areaLabel = view.isNational ? '全国・47都道府県' : view.area.areaName;
  const signed = (value: number) =>
    value > 0 ? `+${format(value)}` : format(value);
  const tableLabel = view.isNational ? '都道府県' : '相手の都道府県';
  return (
    <div
      className="min-w-0"
      data-theme-component-key="migration-demographics"
      data-data-state="ready"
      data-area-code={view.area.areaCode}
      data-sex={sex}
      data-age-code={ageCode}
    >
      <ChartPanel
        title="年齢・男女別の県間移動"
        description={`2025年中 · ${areaLabel} · ${SEX_LABELS[sex]} · ${view.ageLabel} · 外国人を含む移動者`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source="住民基本台帳人口移動報告 2025年"
            sourceLinks={snapshot.sources.map((source, index) => ({
              label:
                index === 0
                  ? '年報第8-1表：年齢・男女・移動前後の住所地'
                  : '年報第9表：年齢・男女別の転入・転出',
              url: source.url,
            }))}
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <PopulationSexSelect value={sex} onChange={setSex} />
          <PopulationProfileSelect
            label="年齢"
            value={ageCode}
            options={snapshot.ages}
            onChange={setAgeCode}
          />
          {!view.isNational && (
            <PopulationProfileSelect
              label="相手の都道府県"
              value={activePartner}
              options={[
                { code: 'all', label: 'すべての相手県' },
                ...view.partners.map((area) => ({
                  code: area.areaCode,
                  label: area.areaName,
                })),
              ]}
              onChange={setPartnerCode}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {view.isNational
            ? '各都道府県と他県との移動を示します。'
            : `${view.area.areaName}への移動が転入、${view.area.areaName}からの移動が転出です。`}
          転入超過が負数の場合は転出超過です。進学・就職などの転居理由は区別していません。
        </p>
        <Table
          aria-label={`${areaLabel}の県間移動・${SEX_LABELS[sex]}・${view.ageLabel}`}
          className="min-w-96"
          containerClassName="min-w-0 max-w-full"
        >
          <TableCaption>
            県コード順。県内移動と海外との移動を含みません。年齢は移動時の年齢です。総数と年齢計の差も選択できます。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{tableLabel}</TableHead>
              <TableHead scope="col" className="text-right">
                転入（人）
              </TableHead>
              <TableHead scope="col" className="text-right">
                転出（人）
              </TableHead>
              <TableHead scope="col" className="text-right">
                転入超過（人）
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.rows.map((row) => (
              <TableRow key={row.areaCode} data-counterpart-code={row.areaCode}>
                <TableHead scope="row" className="whitespace-normal">
                  {row.areaName}
                </TableHead>
                <TableCell
                  className="text-right tabular-nums"
                  data-inbound={row.inbound}
                >
                  {format(row.inbound)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-outbound={row.outbound}
                >
                  {format(row.outbound)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-net={row.net}
                >
                  {signed(row.net)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead scope="row">表示行の計</TableHead>
              <TableCell
                className="text-right tabular-nums"
                data-total-inbound={view.total.inbound}
              >
                {format(view.total.inbound)}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                data-total-outbound={view.total.outbound}
              >
                {format(view.total.outbound)}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                data-total-net={view.total.net}
              >
                {signed(view.total.net)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        {view.withinPrefecture !== null && (
          <p
            className="text-sm text-muted-foreground"
            data-within-prefecture={view.withinPrefecture}
          >
            別計：{view.area.areaName}内の移動は{format(view.withinPrefecture)}
            人（同じ男女・年齢条件）。相手県の選択条件には含まれません。
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          総数と年齢計の差は、全国の県間移動で2人、県内移動で2人です。年齢階級に配分せず別に残しています。
        </p>
      </ChartPanel>
    </div>
  );
}
