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
import { INDUSTRY_SPECIALIZATION_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { IndustrySpecializationSnapshot } from '../lib/industry-specialization-snapshot';

const format = (value: number, digits = 0) =>
  value.toLocaleString('ja-JP', { maximumFractionDigits: digits });

export function ThemeIndustrySpecializationClient({
  snapshot,
}: {
  snapshot: IndustrySpecializationSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const area = selectedPrefectureCode
    ? snapshot.areas.find((row) => row.areaCode === selectedPrefectureCode)!
    : snapshot.national;
  return (
    <div
      data-theme-component-key="industry-specialization"
      data-data-state="ready"
      data-area-code={area.areaCode}
    >
      <ChartPanel
        title="18業種の雇用構成を全国と比べる"
        description={`2021年6月1日 · ${area.areaName} · 民営事業所の従業者`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={INDUSTRY_SPECIALIZATION_SOURCE.title}
            sourceLink={INDUSTRY_SPECIALIZATION_SOURCE.url}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          全産業の従業者は{format(area.totalEmployees)}
          人。このうち、大分類内訳に分かれない
          {format(area.unclassifiedEmployees)}人も構成割合の分母に含めています。
        </p>
        <Table aria-label={`${area.areaName}の18業種の雇用構成と特化係数`}>
          <TableCaption>
            特化係数1は全国と同じ構成割合です。1を超える業種は全国より割合が高く、生産性や成長性の評価を表すものではありません。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">産業</TableHead>
              <TableHead scope="col" className="text-right">
                従業者
                <br />
                （人）
              </TableHead>
              <TableHead scope="col" className="text-right">
                構成割合
                <br />
                （%）
              </TableHead>
              <TableHead scope="col" className="text-right">
                全国割合
                <br />
                （%）
              </TableHead>
              <TableHead scope="col" className="text-right">
                特化
                <br />
                係数
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {area.industries.map((row) => (
              <TableRow
                key={row.industryCode}
                data-industry-code={row.industryCode}
              >
                <TableHead scope="row" className="min-w-32 whitespace-normal">
                  {row.industryName}
                </TableHead>
                <TableCell
                  className="text-right tabular-nums"
                  data-employees={row.employees}
                >
                  {format(row.employees)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-share={row.sharePercent}
                >
                  {format(row.sharePercent, 2)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-national-share={row.nationalSharePercent}
                >
                  {format(row.nationalSharePercent, 2)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-location-quotient={row.locationQuotient}
                >
                  {format(row.locationQuotient, 2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs leading-relaxed text-muted-foreground">
          公務、農林漁業の個人経営、外国会社・法人でない団体等は対象に含みません。事業所の所在地で集計しています。
        </p>
      </ChartPanel>
    </div>
  );
}
