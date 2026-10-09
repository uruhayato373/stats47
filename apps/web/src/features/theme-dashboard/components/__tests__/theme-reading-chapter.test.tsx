import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

import { DEFAULT_METRIC_PRESENTATION } from '../../../../../../../data/metrics/defaults/presentation';
import { ThemeMetricsDashboard } from '../ThemeMetricsDashboard';

import type { ThemeConfig, ThemeIndicatorData } from '../../types';

/**
 * 考察・FAQ (markdown-section) の置き場所の契約 (THEME-REVIEW では 8 テーマの「読み方」章)。
 *
 * 2026-10-08 まで、markdown は章の chartKeys に関係なくページ末尾にまとめて描かれ、
 * 読み方章は見出しと説明だけの空の章に見えていた (THEME-READING-CHAPTER-EMPTY-01)。
 */

vi.mock('../SingleMetricCard', () => ({
  SingleMetricCard: ({ metric }: { metric: { metricKey: string } }) => (
    <div data-block={`card:${metric.metricKey}`} />
  ),
}));
vi.mock('../MetricSwitcherPanel', () => ({
  MetricSwitcherPanel: () => <div data-block="switcher" />,
}));
vi.mock('../ThemeDbChartRenderer', () => ({
  ThemeDbChartRenderer: ({
    chart,
    headingLevel,
  }: {
    chart: { componentKey: string };
    headingLevel?: number;
  }) => (
    <div
      data-block={`md:${chart.componentKey}`}
      data-heading-level={headingLevel ?? 2}
    />
  ),
}));
vi.mock('../ThemeComparisonSection', () => ({
  ThemeComparisonSection: () => <div data-block="comparison" />,
}));
vi.mock('../../actions', () => ({
  fetchMetricTimeseriesAction: vi.fn(),
}));




function indicatorData(title: string): ThemeIndicatorData {
  return {
    rankingItem: { title, unit: '円', visualization: { ...DEFAULT_METRIC_PRESENTATION, colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' } },
    rankingValues: Array.from({ length: 12 }, (_, i) => ({
      areaCode: String(i + 1).padStart(5, '0'),
      value: 100 + i,
      rank: i + 1,
    })),
    nationalSeries: [
      { year: 2020, value: 1 },
      { year: 2021, value: 2 },
    ],
  } as unknown as ThemeIndicatorData;
}

function markdown(componentKey: string): PageComponent {
  return {
    componentKey,
    componentType: 'markdown-section',
    title: componentKey,
    description: null,
    componentProps: { markdown: '本文' },
    sourceName: null,
    sourceLink: null,
    rankingLink: null,
    gridColumnSpan: 12,
    gridColumnSpanTablet: null,
    gridColumnSpanSm: null,
    dataSource: null,
    section: null,
    sortOrder: 0,
  };
}

function renderDashboard() {
  const themeConfig = {
    themeKey: 'consumer-prices',
    tabIndicators: [{ rankingKey: 'price', tabLabel: 'price' }],
    defaultRankingKey: 'price',
    hideMap: true,
  } as unknown as ThemeConfig;
  return render(
    <ThemeMetricsDashboard
      themeConfig={themeConfig}
      indicatorDataMap={{ price: indicatorData('物価') }}
      selectedPrefectureCode={null}
      metricGroups={[
        { key: 'level', title: '水準', rankingKeys: ['price'], defaultCheckedKeys: ['price'] },
      ]}
      sections={[
        { key: 'level', title: '総合水準', metricGroupKeys: ['level'], chartKeys: [] },
        { key: 'reading', title: '読み方', metricGroupKeys: [], chartKeys: ['md-faq'] },
      ]}
      pageCharts={[markdown('md-faq'), markdown('md-unassigned')]}
    />
  );
}

/** ページ上の部品と章を、DOM の出現順に並べる */
function pageOrder(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-block], section[id^="theme-section-"]')].map(
    (el) => el.getAttribute('data-block') ?? el.id
  );
}

describe('ThemeMetricsDashboard — 考察・FAQ の置き場所', () => {
  it('章の chartKeys にある FAQ をその章の見出しの下に描く', () => {
    const { container } = renderDashboard();
    const reading = container.querySelector('#theme-section-reading');
    expect(reading?.querySelector('[data-block="md:md-faq"]')).not.toBeNull();
  });

  it('FAQ だけの章は比較の節の後ろに置き、どの章にも属さない markdown は最後に残す', () => {
    const { container } = renderDashboard();
    expect(pageOrder(container)).toEqual([
      'theme-section-level',
      'card:price',
      'comparison',
      'theme-section-reading',
      'md:md-faq',
      'md:md-unassigned',
    ]);
  });

  it('章の中の FAQ は h3、章に属さない markdown は h2 で見出しを描く', () => {
    const { container } = renderDashboard();
    expect(
      container.querySelector('[data-block="md:md-faq"]')?.getAttribute('data-heading-level')
    ).toBe('3');
    expect(
      container.querySelector('[data-block="md:md-unassigned"]')?.getAttribute('data-heading-level')
    ).toBe('2');
  });
});
