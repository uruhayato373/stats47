import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RankingNationalAverageStat } from '../RankingNationalAverageStat';

import type { NationalAveragePoint } from '../../../lib/build-national-average-series';

const point = (year: number, mean: number, total: number | null): NationalAveragePoint => ({
  year, yearCode: String(year), yearName: `${year}年`, value: mean, mean, total,
  count: 47, kind: 'simple-mean',
});
const figure = { value: 20, kind: 'simple-mean', label: '47都道府県の単純平均', prefectureCount: 47 } as const;
const presentation = { colorScheme: 'interpolateBlues', trendDomain: { mode: 'extent' } } as const;

describe('RankingNationalAverageStat', () => {
  it('presents total and mean together with metric-specific tooltip names and no persistent marker or legend', () => {
    const { container } = render(<RankingNationalAverageStat metricTitle="総人口" figure={figure} unit="人"
      series={[point(2020, 10, 470), point(2024, 20, 940)]} yearName="2024年" precision={0} presentation={presentation} />);
    expect(screen.getByRole('heading', { name: '総人口の推移' })).toBeTruthy();
    expect([...container.querySelectorAll('dt')].map((node) => node.textContent)).toEqual(['合計：', '平均：']);
    expect([...container.querySelectorAll('dd')].map((node) => node.textContent)).toEqual(['940人', '20人']);
    expect(container.querySelector('[data-selected-year]')).toBeNull();
    expect(container.querySelectorAll('circle, svg text')).toHaveLength(0);
    expect(screen.queryByText('単純平均')).toBeNull();
    fireEvent.focus(screen.getByRole('slider'));
    const tooltip = document.getElementById('prefecture-map-tooltip')!;
    expect(tooltip.textContent).toContain('総人口（全国）');
    expect(tooltip.textContent).toContain('総人口（都道府県平均）');
    expect(tooltip.textContent).toContain('2024年');
    expect(tooltip.textContent).toContain('940');
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Home' });
    expect(tooltip.textContent).toContain('2020年');
    expect(tooltip.textContent).toContain('470');
  });

  it('shows only the mean when totals are disabled, including a complete metric name', () => {
    const { container } = render(<RankingNationalAverageStat metricTitle="年間日照時間" figure={figure} unit="時間"
      series={[point(2020, 10, null), point(2024, 20, null)]} yearName="2024年" precision={1} presentation={presentation} />);
    expect(container.querySelectorAll('dt')).toHaveLength(1);
    expect(container.querySelector('dt')!.textContent).toBe('平均：');
    expect(container.querySelector('[data-series="total"]')).toBeNull();
    fireEvent.focus(screen.getByRole('slider'));
    expect(document.getElementById('prefecture-map-tooltip')!.textContent).toContain('年間日照時間（都道府県平均）');
  });

  it('leaves a missing selected-year total blank instead of substituting the official national value', () => {
    const { container } = render(<RankingNationalAverageStat metricTitle="総人口"
      figure={{ value: 1000, kind: 'national-total', label: '全国計', prefectureCount: null }} unit="人"
      series={[point(2020, 10, 470), point(2024, 20, null)]} yearName="2024年" precision={0} presentation={presentation} />);
    expect([...container.querySelectorAll('dd')].map((node) => node.textContent)).toEqual(['—', '20人']);
  });

  it('follows presentation changes with one hue for both series, independent of metric name and selected year', () => {
    const series = [point(2020, 10, 470), point(2024, 20, 940)];
    const { container, rerender } = render(<RankingNationalAverageStat metricTitle="総人口" figure={figure} unit="人"
      series={series} yearName="2024年" precision={0} presentation={presentation} />);
    const lineColor = () => container.querySelector('[data-series="line"]')!.getAttribute('stroke');
    const initialColor = lineColor();
    expect(container.querySelector('[data-series="total"]')!.getAttribute('fill')).toBe(initialColor);
    expect(container.querySelector('[data-series="total"]')!.getAttribute('fill-opacity')).toBe('0.14');
    rerender(<RankingNationalAverageStat metricTitle="総人口" figure={figure} unit="人"
      series={series} yearName="2024年" precision={0} presentation={{ ...presentation, colorScheme: 'interpolateGreens' }} />);
    const newColor = lineColor();
    expect(newColor).not.toBe(initialColor);
    expect(container.querySelector('[data-series="total"]')!.getAttribute('fill')).toBe(newColor);
    expect(container.querySelector('[data-series="total-outline"]')!.getAttribute('stroke')).toBe(newColor);
    fireEvent.focus(screen.getByRole('slider'));
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Home' });
    expect(lineColor()).toBe(newColor);
    expect(document.getElementById('prefecture-map-tooltip')!.innerHTML).toContain(newColor);
  });
});
