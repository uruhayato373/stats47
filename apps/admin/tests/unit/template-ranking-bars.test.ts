import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { RANKING_BAR_PLOT, rankBadgeFontSize, rankingBarRows, renderItemBarsChart, renderRankingBars } from '@/lib/template-ranking-bars';
import { RANKING_SAMPLE_PRESENTATION } from '@/lib/template-ranking-data';
import { RANKING_SAMPLE_METRIC } from '@/lib/template-ranking-data';
import { resolveMetricColor } from '../../../remotion/src/features/data-cards/tile-scale';
import { CHART_THEMES, toHex } from '../../../remotion/src/features/data-cards/chart-theme';

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
  it('draws upper and lower five as cards in the metric colour, over the full-data range, with no axis grid', async () => {
    const svg = renderRankingBars(fixture());
    expect(svg.match(/data-rank=/g)).toHaveLength(10);
    expect(svg.match(/data-bar-track="true"/g)).toHaveLength(10);
    expect(svg.match(/data-bar-value="true"/g)).toHaveLength(10);
    // Upper bands, badges and bars take the metric's own colour (like its map); the lower five its lighter tint.
    const color = toHex(resolveMetricColor(RANKING_SAMPLE_METRIC.visualization)!);
    expect(color).not.toBe('#304BC6');
    expect(svg.split(`fill="${color}"`).length - 1).toBeGreaterThanOrEqual(1 + 5 * 2);
    const lower = /<rect x="64" y="[\d.]+" width="952" height="60" rx="14" fill="([^"]+)"\/>\s*<text[^>]*>下位5県/.exec(svg)?.[1];
    expect(lower).toBeDefined();
    expect(lower).not.toBe(color);
    // Ranks are badges, values sit right with their unit; the minimum keeps a visible marker.
    expect(svg).toMatch(/text-anchor="middle"[^>]*>1<\/text>/);
    expect(svg).toContain('>36.0<tspan font-size="26" dx="4">°C</tspan>');
    expect(svg).toContain('>31.4<tspan');
    expect(svg).toContain('data-domain-min="31.4"');
    expect(svg).toContain('data-domain-max="36"');
    expect(svg).toContain(`<circle cx="${RANKING_BAR_PLOT.left}"`);
    expect(svg).not.toContain('<line ');
    expect(svg).not.toContain('stats47');
    expect(svg).toContain('範囲：31.4–36.0');
    expect(svg).toContain('日最高気温の月平均の最高値');
    expect(svg).toContain('上位5県');
    expect(svg).toContain('下位5県');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
  });
  it('draws the dark theme on grey paper with outlined rows and readable values, same data marks', () => {
    const light = renderRankingBars(fixture());
    const dark = renderRankingBars(fixture(), undefined, CHART_THEMES.dark);
    expect(dark).toContain(`fill="${CHART_THEMES.dark.paper}"`);
    expect(dark).toContain(`stroke="${CHART_THEMES.dark.outline}"`);
    expect(dark).not.toContain(CHART_THEMES.light.paper);
    expect(light).not.toContain('stroke=');
    // Same ranks, values and bar geometry; only colours change.
    const marks = (svg: string) => [...svg.matchAll(/data-bar-value="true" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)].map((m) => m.slice(1).join());
    expect(marks(dark)).toEqual(marks(light));
    const value = toHex(resolveMetricColor(RANKING_SAMPLE_METRIC.visualization)!);
    expect(dark).not.toMatch(new RegExp(`fill="${value}">36\\.0`));
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
  it('keeps a rank of up to four digits inside its badge, leaving one and two digits as they were', () => {
    // A municipal set (1,700 rows) gives four-digit ranks in the lower card (IMAGE-BAR-RANK-BADGE-01).
    expect([1, 9, 10, 47].map(rankBadgeFontSize)).toEqual([30, 30, 26, 26]);
    const badgeTextWidth = 27 * 2 - 8;
    for (const rank of [100, 999, 1648, 9999]) expect(String(rank).length * 0.6 * rankBadgeFontSize(rank)).toBeLessThanOrEqual(badgeTextWidth);
    const rows = Array.from({ length: 1700 }, (_, i) => ({ name: '市' + (i + 1), value: 1700 - i }));
    const svg = renderItemBarsChart({ title: '市区町村', yearLabel: '2023年', unit: '百万円', source: 'e-Stat', presentation: RANKING_SAMPLE_PRESENTATION, rows, formatValue: (v) => String(v) });
    expect(svg).toContain(`font-size="${rankBadgeFontSize(1700)}" font-weight="700" fill="#FFFFFF">1700</text>`);
  });
});
