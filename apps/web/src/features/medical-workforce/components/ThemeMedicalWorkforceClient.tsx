'use client';

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
import { MEDICAL_WORKFORCE_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectMedicalWorkforceArea,
  type MedicalWorkforceSnapshot,
} from '../lib/medical-workforce-snapshot';

const format = (value: number, digits = 0) =>
  value.toLocaleString('ja-JP', { maximumFractionDigits: digits });

function WorkforceTable({
  areaName,
  kind,
  rows,
  total,
}: {
  areaName: string;
  kind: '年齢階級' | '主たる診療科';
  rows: { label: string; physicians: number }[];
  total: number;
}) {
  return (
    <Table
      aria-label={`${areaName}の医師の${kind}別人数と構成割合`}
      className="min-w-96"
      containerClassName="min-w-0 max-w-full"
    >
      <TableCaption>
        構成割合は同じ地域・同じ年の医療施設従事医師{format(total)}
        人が分母です。表示は四捨五入しています。
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{kind}</TableHead>
          <TableHead scope="col" className="text-right">
            医師数（人）
          </TableHead>
          <TableHead scope="col" className="text-right">
            構成割合（%）
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label} data-workforce-category={row.label}>
            <TableHead scope="row" className="min-w-36 whitespace-normal">
              {row.label}
            </TableHead>
            <TableCell
              className="text-right tabular-nums"
              data-physicians={row.physicians}
            >
              {format(row.physicians)}
            </TableCell>
            <TableCell
              className="text-right tabular-nums"
              data-share={(row.physicians / total) * 100}
            >
              {format((row.physicians / total) * 100, 2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">合計</TableHead>
          <TableCell
            className="text-right tabular-nums"
            data-total-physicians={total}
          >
            {format(total)}
          </TableCell>
          <TableCell className="text-right tabular-nums">100</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function ThemeMedicalWorkforceClient({
  snapshot,
}: {
  snapshot: MedicalWorkforceSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const area = selectMedicalWorkforceArea(snapshot, selectedPrefectureCode);
  if (!area)
    return (
      <ChartPanel title="診療科と年齢から見る医療人材">
        <p role="status" className="text-sm text-muted-foreground">
          選択した地域の確認済みデータを取得できません。
        </p>
      </ChartPanel>
    );
  const areaLabel =
    area.areaCode === '00000' ? '全国（公式集計）' : area.areaName;
  const source = MEDICAL_WORKFORCE_SOURCE;
  return (
    <div
      className="min-w-0 space-y-6"
      data-theme-component-key="medical-workforce"
      data-data-state="ready"
      data-area-code={area.areaCode}
    >
      <ChartPanel
        title="医師の年齢構成（14階級）"
        description={`2024年12月31日 · ${areaLabel} · 医療施設に従事する医師`}
        contentClassName="min-w-0"
        footer={
          <ChartFooter
            source="令和6年医師・歯科医師・薬剤師統計 医師第5表"
            sourceLink={source.files[0].url}
          />
        }
      >
        <WorkforceTable
          areaName={areaLabel}
          kind="年齢階級"
          total={area.totalPhysicians}
          rows={area.ages.map((point) => ({
            label: point.ageGroup,
            physicians: point.physicians,
          }))}
        />
      </ChartPanel>
      <ChartPanel
        title="主たる診療科の構成（45区分）"
        description={`2024年12月31日 · ${areaLabel} · 主たる従業地別`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source="令和6年医師・歯科医師・薬剤師統計 医師第21表"
            sourceLink={source.files[1].url}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          主に従事する診療科を1つずつ数えた人数です。臨床研修医・その他・不詳も含めて全体を示します。常勤換算や専門医資格の人数ではありません。
        </p>
        <WorkforceTable
          areaName={areaLabel}
          kind="主たる診療科"
          total={area.totalPhysicians}
          rows={area.specialties.map((point) => ({
            label: point.specialty,
            physicians: point.physicians,
          }))}
        />
      </ChartPanel>
    </div>
  );
}
