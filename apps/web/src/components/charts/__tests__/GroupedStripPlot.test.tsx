import { resolveStripScale } from '@stats47/ranking';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GroupedStripPlot } from '../GroupedStripPlot';

const groups = [
  { key: '13000', label: '東京都', values: [168, 500_000, 900_000], median: 500_000 },
  { key: '14000', label: '神奈川県', values: [2_900, 3_750_000], median: 2_900 },
];

function renderPlot(values: number[]) {
  const scale = resolveStripScale(values)!;
  return render(
    <GroupedStripPlot
      groups={groups}
      scale={scale}
      formatTick={String}
      formatValue={(value) => `${value}人`}
      color="#2563eb"
      unit="人"
      ariaLabel="総人口の都道府県別の分布"
    />,
  );
}

describe('GroupedStripPlot: 県ごとの印の帯', () => {
  it('1 行の印は 1 本の path にまとめ、市区町村 1 つにつき印 1 つを描く (要素を値の数だけ増やさない)', () => {
    const { container } = renderPlot(groups.flatMap((group) => group.values));
    const rows = container.querySelectorAll('svg');
    expect(rows).toHaveLength(2);
    rows.forEach((svg, index) => {
      expect(svg.querySelectorAll('path')).toHaveLength(3);
      const marks = svg.querySelectorAll('path')[1]!.getAttribute('d')!;
      expect(marks.match(/M/g)).toHaveLength(groups[index]!.values.length);
    });
  });

  it('行の見出しは文字だけで、リンクを置かない (47 県のリンクは右レールのチップが持つ)', () => {
    const { container } = renderPlot(groups.flatMap((group) => group.values));
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toContain('東京都');
    expect(container.textContent).toContain('500000人');
  });

  it('対数の軸と、端に寄せた値があることを図の下に書く', () => {
    expect(renderPlot([168, 3_750_000]).container.querySelector('figcaption')?.textContent).toContain('対数の目盛り');
    const clipped = [-15, ...Array.from({ length: 98 }, (_, index) => index * 0.05), 3.2];
    expect(renderPlot(clipped).container.querySelector('figcaption')?.textContent).toContain('端に寄せて表示');
  });

  it('目盛りが 5 つ以上なら、狭い画面では目盛りの文字を 1 つおきに隠す (100・1万・100万 を残す)', () => {
    const { container } = renderPlot([168, 3_750_000]);
    const labels = [...container.querySelectorAll('[data-chart="grouped-strip-plot"] > span:nth-child(2) > span')];
    expect(labels.map((label) => label.textContent)).toEqual(['100', '1000', '10000', '100000', '1000000', '10000000']);
    expect(labels.filter((label) => label.hasAttribute('data-tick-thinned')).map((label) => label.textContent)).toEqual(['1000', '100000', '10000000']);
    // 目盛りが 5 つ未満 (全部同じ値で 1 つ) なら間引かない
    expect(renderPlot([5, 5]).container.querySelector('[data-tick-thinned]')).toBeNull();
  });
});
