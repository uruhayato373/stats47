import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FixedYearComparisonPanel } from '../FixedYearComparisonPanel';

import type { ThemeIndicatorData } from '../../types';
import type { MetricKpi } from '../metric-kpi';

const metric = (key: string): MetricKpi => ({
  metricKey: key, title: key === 'first' ? '元請完成工事高' : '下請完成工事高',
  unit: '百万円', value: null, rank: null, total: 47, series: [], topRanked: null, isLoading: false,
});
const values = (year: string, multiplier = 1) => Array.from({ length: 47 }, (_, index) => ({
  areaCode: `${String(index + 1).padStart(2, '0')}000`, yearCode: year, yearName: `${year}年度`,
  value: index * multiplier, unit: '百万円', rank: 47 - index,
}));
const data = (years = ['2023']): ThemeIndicatorData => ({
  rankingItem: { title: '完成工事高', unit: '百万円' },
  rankingValues: years.flatMap((year) => values(year)),
}) as ThemeIndicatorData;
function panel(overrides: Partial<React.ComponentProps<typeof FixedYearComparisonPanel>> = {}) {
  return <FixedYearComparisonPanel metrics={[metric('first')]} comparisonYear="2023"
    indicatorDataMap={{ first: data(['2023', '2024']) }} selectedPrefectureCode={null} {...overrides} />;
}

describe('固定年の県別比較', () => {
  it('最新年を混ぜず47県すべてと実測ゼロを表示する', () => {
    render(panel());
    const table = screen.getByRole('table', { name: '2023年の都道府県比較' });
    expect(within(table).getAllByRole('row')).toHaveLength(48);
    expect(within(table).getByRole('row', { name: '北海道 2023年度 0 百万円' })).toBeVisible();
    expect(within(table).queryByText('2024年度')).toBeNull();
  });
  it('対象年が無ければ最新年へ代替しない', () => {
    render(panel({ indicatorDataMap: { first: data(['2024']) } }));
    expect(screen.getByText('2023年の観測値がありません')).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });
  it('県選択時は当該県だけを同じ年で示す', () => {
    render(panel({ selectedPrefectureCode: '13000' }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('row', { name: '東京都 2023年度 12 百万円' })).toBeVisible();
  });
  it('元請・下請を切り替え、値を合算しない', async () => {
    const user = userEvent.setup();
    render(panel({ metrics: [metric('first'), metric('second')], indicatorDataMap: {
      first: data(), second: { ...data(), rankingValues: values('2023', 2) } as ThemeIndicatorData,
    }, selectedPrefectureCode: '13000' }));
    await user.click(screen.getByRole('button', { name: '下請完成工事高' }));
    expect(screen.getByRole('row', { name: '東京都 2023年度 24 百万円' })).toBeVisible();
    expect(screen.getByRole('link', { name: '指標の定義・ランキング' })).toHaveAttribute('href', '/ranking/second');
  });
  it('短いタブ名で切り替え、棒グラフにも全県と実測ゼロを残す', async () => {
    const user = userEvent.setup();
    render(panel({ metrics: [metric('first'), metric('second')], indicatorDataMap: { first: data(), second: data() }, tabLabels: { first: '元請', second: '下請' } }));
    await user.click(screen.getByRole('button', { name: /^下請$/ }));
    await user.click(screen.getByRole('button', { name: /^棒グラフ$/ }));
    const chart = screen.getByRole('region', { name: '2023年の下請完成工事高の棒グラフ' });
    expect(within(chart).getByText('北海道')).toBeVisible();
    expect(within(chart).getByText('沖縄県')).toBeVisible();
    expect(chart.querySelectorAll('[style]')).toHaveLength(47);
    expect(screen.queryByRole('table')).toBeNull();
    await user.click(screen.getByRole('button', { name: /^表$/ }));
    expect(screen.getAllByRole('row')).toHaveLength(48);
  });
});
