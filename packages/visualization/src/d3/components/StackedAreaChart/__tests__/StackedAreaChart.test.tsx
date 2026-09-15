import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StackedAreaChart } from '../StackedAreaChart';

const data = [
  { category: '2020', label: '2020年度', young: 1_200_000, working: 3_800_000 },
  { category: '2025', label: '2025年度', young: 1_000_000, working: 3_500_000 },
];
const series = [
  { key: 'young', label: '15歳未満', color: '#6674d8' },
  { key: 'working', label: '15〜64歳', color: '#67aaa8' },
];

afterEach(() => {
  document.getElementById('prefecture-map-tooltip')?.remove();
});

describe('StackedAreaChart', () => {
  it('系列・期間・単位を支援技術へ伝える', () => {
    render(
      <StackedAreaChart
        title="年齢3区分人口の推移"
        data={data}
        series={series}
        unit="人"
      />
    );

    expect(
      screen.getByRole('img', {
        name: '積み上げ面グラフ「年齢3区分人口の推移」。系列: 15歳未満、15〜64歳。期間: 2020年度から2025年度。単位: 人',
      })
    ).toBeTruthy();
  });

  it('大きな値の軸を短くし、完全値と単位はツールチップへ表示する', async () => {
    const { container } = render(
      <StackedAreaChart data={data} series={series} unit="人" />
    );

    const tickLabels = Array.from(container.querySelectorAll('.tick text')).map(
      (node) => node.textContent ?? ''
    );
    expect(tickLabels.some((label) => label.includes('万'))).toBe(true);
    expect(tickLabels).not.toContain('5,000,000');

    const overlay = container.querySelector('rect[fill="transparent"]');
    expect(overlay).toBeTruthy();
    fireEvent.mouseEnter(overlay!);

    await waitFor(() => {
      const tooltip = document.getElementById('prefecture-map-tooltip');
      expect(tooltip?.textContent).toContain('1,200,000');
      expect(tooltip?.textContent).toContain('人');
      expect(tooltip?.textContent).toContain('15歳未満');
    });
  });
});
