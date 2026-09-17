import { describe, expect, it } from 'vitest';
import { generateBarChartSvg, type BarItem } from '../bar-chart';

const items: BarItem[] = [
  { label: '東京都', rank: 1, value: 2.5 },
  { label: '沖縄県', rank: 2, value: -5.21 },
  { label: '…', value: 0, isSeparator: true },
  { label: '青森県', rank: 46, value: -39.03 },
  { label: '秋田県', rank: 47, value: -41.59 },
];

describe.each(['columns', 'mobile', 'portrait'] as const)('%s ranking cards', (layout) => {
  const options = { title: '将来人口増減率', unit: '％', layout };
  const valueBars = (svg: string) => svg.match(/<rect[^>]+opacity="0\.(?:8|85)"/g) ?? [];

  it('omits every quantitative bar when disabled, preserving signed values and ranks', () => {
    const svg = generateBarChartSvg(items, { ...options, showBars: false });
    expect(valueBars(svg)).toHaveLength(0);
    for (const value of ['2.50', '-5.21', '-39.03', '-41.59']) {
      expect(svg).toContain(`>${value} ％</text>`);
    }
    for (const item of items.filter((item) => !item.isSeparator)) {
      expect(svg).toContain(`>${item.label}</text>`);
      expect(svg).toContain(`>${item.rank}</text>`);
    }
    expect(svg).not.toContain('width="0"');
  });

  it('retains the existing default rendering unless explicitly disabled', () => {
    const positiveItems = items.map((item) => ({ ...item, value: Math.abs(item.value) }));
    const svg = generateBarChartSvg(positiveItems, options);
    expect(svg).toBe(generateBarChartSvg(positiveItems, { ...options, showBars: true }));
    expect(valueBars(svg)).toHaveLength(4);
  });
});

describe('mobile editorial ranking cards', () => {
  it('uses a narrow stacked canvas and readable text for article and note bodies', () => {
    const svg = generateBarChartSvg(items, {
      title: '将来人口増減率',
      subtitle: '2025年',
      source: '総務省',
      unit: '％',
      layout: 'mobile',
    });

    expect(svg).toContain('width="640" height="960" viewBox="0 0 640 960"');
    expect(svg).toContain('font-size="24" font-weight="bold" fill="#1f2937">東京都</text>');
    expect(svg).toContain('font-size="22" font-weight="700"');
    expect(svg).toContain('font-size="20" class="svg-tick">出典: 総務省</text>');
  });
});
