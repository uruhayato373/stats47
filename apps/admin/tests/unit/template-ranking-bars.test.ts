import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { rankingBarRows, renderRankingBars } from '@/lib/template-ranking-bars';

// Synthetic values test the renderer contract only; they are never used in the sample UI.
const fixture = () => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 },
  unit: '℃',
  data: Array.from({ length: 47 }, (_, i) => ({ rank: i + 1, area_code: String(i + 1).padStart(2, '0') + '000', area_name: '県' + (i + 1), year: '2024', value: 36 - i / 10 })),
});
describe('ranking bar basic form', () => {
  it('takes upper and lower five from the complete ranked input without changing ranks or values', () => {
    const input = fixture();
    const result = rankingBarRows({ ...input, data: [...input.data].reverse() });
    expect(result.top).toEqual(input.data.slice(0, 5));
    expect(result.bottom).toEqual(input.data.slice(-5));
    expect(input.data).toHaveLength(47);
  });
  it('rejects partial data, duplicate prefectures, wrong year and broken ranking order', () => {
    const input = fixture();
    expect(() => rankingBarRows({ ...input, data: input.data.slice(0, 10) })).toThrow();
    expect(() => rankingBarRows({ ...input, _meta: { ...input._meta, year: 2025 } })).toThrow();
    expect(() => rankingBarRows({ ...input, data: input.data.map((r, i) => i === 46 ? { ...r, area_code: '01000' } : r) })).toThrow();
    expect(() => rankingBarRows({ ...input, data: input.data.map((r, i) => i === 46 ? { ...r, value: 39 } : r) })).toThrow();
  });
  it('uses the full-data range for both groups with direct labels, no axis grid and a visible minimum', async () => {
    const svg = renderRankingBars(fixture());
    expect(svg.match(/data-rank=/g)).toHaveLength(10);
    expect(svg.match(/data-bar-track="true"/g)).toHaveLength(10);
    expect(svg.match(/data-bar-value="true"/g)).toHaveLength(10);
    expect(svg.match(/fill="#304BC6"\/>/g)).toHaveLength(11);
    expect(svg).toContain('data-domain-min="31.4"');
    expect(svg).toContain('data-domain-max="36"');
    expect(svg).not.toContain('data-axis-break');
    // The sole remaining line separates the source; there are no axis/grid lines.
    expect(svg.match(/<line /g)).toHaveLength(1);
    expect(svg).not.toContain('text-anchor="middle"');
    expect(svg).toContain('範囲：31.4–36.0');
    expect(svg).not.toContain('0省略');
    expect(svg).toContain('>31.4</text>');
    expect(svg).toContain('>36.0</text>');
    expect(svg).toContain('<circle cx="352"');
    expect(svg).toContain('日最高気温の月平均の最高値');
    expect(svg).toContain('上位5県');
    expect(svg).toContain('下位5県');
    expect(svg).not.toContain('を抜粋');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
  });
  it('still supports an explicit zero baseline without omission marks', () => {
    const svg = renderRankingBars(fixture(), {
      colorScheme: 'interpolateBlues', colorSchemeType: 'sequential',
      domain: { mode: 'extent' }, classification: { method: 'continuous' },
      trendDomain: { mode: 'extent' }, comparisonDomain: { mode: 'extent' },
      barDomain: { mode: 'zero' },
    });
    expect(svg).toContain('data-domain-min="0"');
    expect(svg).toContain('data-domain-max="36"');
    expect(svg).not.toContain('data-axis-break');
    expect(svg).not.toContain('0省略');
  });
});
