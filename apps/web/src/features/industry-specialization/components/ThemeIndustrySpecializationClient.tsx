'use client';

import { ChartPanel } from '@stats47/components';
import { INDUSTRY_SPECIALIZATION_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

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
        <ValueTable
          ariaLabel={`${area.areaName}の18業種の雇用構成と特化係数`}
          caption="特化係数1は全国と同じ構成割合です。1を超える業種は全国より割合が高く、生産性や成長性の評価を表すものではありません。"
          columns={[
            { key: 'industry', header: '産業', rowHeader: true, className: 'min-w-32' },
            {
              key: 'employees',
              header: (
                <>
                  従業者
                  <br />
                  （人）
                </>
              ),
            },
            {
              key: 'share',
              header: (
                <>
                  構成割合
                  <br />
                  （%）
                </>
              ),
            },
            {
              key: 'nationalShare',
              header: (
                <>
                  全国割合
                  <br />
                  （%）
                </>
              ),
            },
            {
              key: 'locationQuotient',
              header: (
                <>
                  特化
                  <br />
                  係数
                </>
              ),
            },
          ]}
          rows={area.industries.map((row) => ({
            key: row.industryCode,
            attrs: { 'data-industry-code': row.industryCode },
            cells: [
              row.industryName,
              { content: format(row.employees), attrs: { 'data-employees': row.employees } },
              { content: format(row.sharePercent, 2), attrs: { 'data-share': row.sharePercent } },
              {
                content: format(row.nationalSharePercent, 2),
                attrs: { 'data-national-share': row.nationalSharePercent },
              },
              {
                content: format(row.locationQuotient, 2),
                attrs: { 'data-location-quotient': row.locationQuotient },
              },
            ],
          }))}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          公務、農林漁業の個人経営、外国会社・法人でない団体等は対象に含みません。事業所の所在地で集計しています。
        </p>
      </ChartPanel>
    </div>
  );
}
