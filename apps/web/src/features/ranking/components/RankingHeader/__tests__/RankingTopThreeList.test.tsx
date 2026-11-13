import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RankingTopThreeList } from '../RankingTopThreeList';

import type { RankingHeaderStats } from '../../../utils/compute-ranking-header-stats';

const stats: RankingHeaderStats = {
  top3: [
    { areaCode: '01000', areaName: '北海道', rank: 1, value: 81.9 },
    { areaCode: '02000', areaName: '青森県', rank: 2, value: 81.2 },
    { areaCode: '03000', areaName: '岩手県', rank: 3, value: 80.8 },
  ],
  bottom3: [
    { areaCode: '45000', areaName: '宮崎県', rank: 45, value: 75 },
    { areaCode: '46000', areaName: '鹿児島県', rank: 46, value: 74 },
    { areaCode: '47000', areaName: '沖縄県', rank: 47, value: 73.2 },
  ],
  average: 76.8,
  count: 47,
};
const presentation = { colorScheme: 'interpolateBlues', comparisonDomain: { mode: 'extent' } } as const;
describe('Ranking summary meaning', () => {
  it('shows six ranked values with no mean line, keeping the mean in point tooltips', () => {
    const { container } = render(
      <RankingTopThreeList
        stats={stats}
        unit="％"
        precision={1}
        presentation={presentation}
      />
    );
    expect(screen.getByText('81.9', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
    expect(screen.getByText('81.2', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
    expect(screen.getByText('73.2', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '上位3件と下位3件' })).toBeTruthy();
    expect(container.querySelectorAll('[data-value]')).toHaveLength(6);
    expect([...container.querySelectorAll('[data-value]')].map((node) => node.getAttribute('data-value'))).toEqual(['81.9', '81.2', '80.8', '75', '74', '73.2']);
    expect(container.querySelector('[data-reference]')).toBeNull();
    expect(container.querySelector('.bg-primary')!.getAttribute('title')).toContain('北海道: 81.9');
    expect(container.querySelector('.bg-primary')!.getAttribute('title')).toContain('単純平均: 76.8');
    expect(container.querySelector('p')).toBeNull();
    expect(container.textContent).not.toContain('破線:');
    expect(container.textContent).not.toContain('位の差');
    // 数値は各行末に1回だけ出し、軸目盛りとの重複を避ける。
    expect(screen.getAllByText('81.9')).toHaveLength(1);
    expect(screen.getAllByText('73.2')).toHaveLength(1);
  });
  it('shows converted values when the page resolved a display unit (千円 → 億円)', () => {
    const tax: RankingHeaderStats = {
      top3: [{ areaCode: '13000', areaName: '東京都', rank: 1, value: 1_544_976_077 }],
      bottom3: [{ areaCode: '31000', areaName: '鳥取県', rank: 47, value: 14_040_236 }],
      average: 117_028_009,
      count: 47,
    };
    const { container } = render(
      <RankingTopThreeList stats={tax} unit="億円" precision={0} factor={0.00001} presentation={presentation} />
    );
    expect(screen.getByText('15,450', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
    expect(screen.getByText('140', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
    expect(container.textContent).toContain('単位: 億円');
    expect(container.textContent).not.toContain('1,544,976,077');
  });
  it('shows tied ranks without adding a gap caption', () => {
    const tied = {
      ...stats,
      top3: [stats.top3[0], { ...stats.top3[1], rank: 1, value: 81.9 }],
    };
    const { container } = render(
      <RankingTopThreeList
        stats={tied}
        unit="人"
        precision={1}
        presentation={presentation}
      />
    );
    expect(container.querySelectorAll('[data-value="81.9"]')).toHaveLength(2);
    expect(container.textContent).not.toContain('同順位');
    expect(container.textContent).not.toContain('1位と1位');
  });
  it('uses the map presentation colour and follows a scheme change without changing ranks or values', () => {
    const { container, rerender } = render(<RankingTopThreeList stats={stats} unit="人" precision={1} presentation={presentation} />);
    const colors = () => [...container.querySelectorAll<HTMLElement>('[data-value] .bg-primary')].map((node) => node.style.backgroundColor);
    const initialColor = colors()[0];
    expect(initialColor).toMatch(/^rgb/);
    expect(new Set(colors()).size).toBe(1);
    rerender(<RankingTopThreeList stats={stats} unit="人" precision={1}
      presentation={{ ...presentation, colorScheme: 'interpolateGreens' }} />);
    expect(colors()[0]).not.toBe(initialColor);
    expect(new Set(colors()).size).toBe(1);
    expect(screen.getByText('81.9', { selector: '.font-medium.tabular-nums' })).toBeTruthy();
  });
  it('renders overlapping top and bottom selections only once when fewer than six regions are available', () => {
    const small = { ...stats, bottom3: [stats.top3[1], stats.top3[2], stats.bottom3[2]], count: 4 };
    const { container } = render(<RankingTopThreeList stats={small} unit="人" precision={1} presentation={presentation} />);
    expect(container.querySelectorAll('[data-value]')).toHaveLength(4);
    expect(screen.getAllByText('青森県')).toHaveLength(1);
    expect(screen.getAllByText('岩手県')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: '上位3件と下位1件' })).toBeTruthy();
  });
});
