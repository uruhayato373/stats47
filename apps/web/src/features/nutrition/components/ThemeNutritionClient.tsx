'use client';

import { ChartPanel } from '@stats47/components';
import { NUTRITION_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { NutritionSnapshot } from '../lib/nutrition-snapshot';

const format = (value: number) => value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });

export function ThemeNutritionClient({ snapshot }: { snapshot: NutritionSnapshot }) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const rows = selectedPrefectureCode
    ? snapshot.rows.filter(row => row.areaCode === selectedPrefectureCode)
    : snapshot.national;
  const area = selectedPrefectureCode ? selectedAreaName : '全国（公式集計）';

  return <div data-theme-component-key="nutrition" data-data-state="ready" data-area-code={selectedPrefectureCode ?? '00000'}>
    <ChartPanel title="栄養摂取量と推計の幅" description={`2024年 · ${area} · 20歳以上、男女とも59歳に年齢調整`}
      contentClassName="min-w-0 space-y-4"
      footer={<ChartFooter source={NUTRITION_SOURCE.title} sourceLink={NUTRITION_SOURCE.url} />}>
      <ValueTable
        ariaLabel={`${area}の栄養摂取量と95%信頼区間`}
        caption="平均と95%信頼区間は1日当たりのグラム数です。集計人数は推計人口ではありません。"
        columns={[
          { key: 'metric', header: '指標', rowHeader: true },
          { key: 'mean', header: <>平均<br />（g/日）</> },
          { key: 'ci', header: <>95%信頼区間<br />（g/日）</> },
          { key: 'sampleSize', header: <>集計<br />人数</> },
        ]}
        rows={NUTRITION_SOURCE.metrics.map(metric => {
          const row = rows.find(point => point.metricKey === metric.key)!;
          return {
            key: metric.key,
            attrs: { 'data-metric-key': metric.key },
            cells: [
              metric.label,
              { content: format(row.mean), attrs: { 'data-mean': row.mean } },
              { content: <>{format(row.lower95)}〜{format(row.upper95)}</>, attrs: { 'data-lower95': row.lower95, 'data-upper95': row.upper95 } },
              { content: row.sampleSize.toLocaleString('ja-JP'), attrs: { 'data-sample-size': row.sampleSize } },
            ],
          };
        })}
      />
      <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">{snapshot.notes.map(note => <li key={note}>{note}</li>)}</ul>
    </ChartPanel>
  </div>;
}
