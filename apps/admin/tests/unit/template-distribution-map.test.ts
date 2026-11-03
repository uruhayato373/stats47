import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderDistributionMap } from '@/lib/template-distribution-map';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

// Synthetic values check code-to-shape colouring; live data stays in the SHA-verified R2 snapshot.
const fixture = () => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃',
  data: Array.from({ length: 47 }, (_, i) => ({
    rank: i + 1, area_code: String(47 - i).padStart(2, '0') + '000',
    area_name: '県' + (47 - i), year: '2024', value: 36.2 - i * 0.17,
  })),
});
const fillOf = (svg: string, code: string) => new RegExp(`data-pref="${code}" data-value="[^"]+" d="[^"]+" fill="([^"]+)"`).exec(svg)?.[1];

describe('geographic distribution map basic form', () => {
  it('draws every prefecture once with its own value, Okinawa in the inset', async () => {
    const svg = await renderDistributionMap(fixture());
    expect(svg.match(/<path data-pref=/g)).toHaveLength(47);
    expect(svg).toContain('data-pref="47" data-value="36.2"');
    expect(svg.split('data-map="okinawa"')[1]).toContain('data-pref="47"');
    expect(fillOf(svg, '47')).not.toBe(fillOf(svg, '01'));
  }, 20000); // First render also loads the site's D3 scale implementation.
  it('keeps far islands out: mainland stays above the source line and a slanted rule sets off Okinawa', async () => {
    const svg = await renderDistributionMap(fixture());
    const ys = (part: string) => [...part.matchAll(/ d="([^"]+)"/g)].flatMap((m) => [...m[1].matchAll(/[\d.]+,([\d.]+)/g)].map((p) => Number(p[1])));
    const mainland = ys(svg.split('data-map="mainland"')[1].split('</g>')[0]);
    expect(Math.max(...mainland)).toBeLessThan(1262);
    // Okinawa is set off by one slanted rule, not a box: within the rule's span every island lies on
    // the sea side and every mainland point on the other, and the arc is drawn large (not a dot in a corner).
    expect(svg).not.toMatch(/<rect[^>]*rx="10"/);
    const rule = /data-okinawa-rule="" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/.exec(svg)!.slice(1).map(Number);
    const points = (part: string) => [...part.matchAll(/ d="([^"]+)"/g)].flatMap((m) => [...m[1].matchAll(/([\d.]+),([\d.]+)/g)].map((p) => [Number(p[1]), Number(p[2])]));
    const side = ([x, y]: number[]) => (rule[2] - rule[0]) * (y - rule[1]) - (rule[3] - rule[1]) * (x - rule[0]);
    const within = (p: number[]) => p[0] >= rule[0] && p[0] <= rule[2];
    const okinawa = points(svg.split('data-map="okinawa"')[1].split('</g>')[0]);
    expect(okinawa.every((p) => side(p) < 0)).toBe(true);
    expect(points(svg.split('data-map="mainland"')[1].split('</g>')[0]).filter(within).every((p) => side(p) > 0)).toBe(true);
    expect(Math.max(...okinawa.map((p) => p[1])) - Math.min(...okinawa.map((p) => p[1]))).toBeGreaterThan(150);
    // Legend card counts every prefecture once.
    const counts = [...svg.matchAll(/>(\d+)県<\/text>/g)].map((m) => Number(m[1]));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(47);
  });
  it('renders a 4:5 PNG with a legend and minimal copy, and rejects an incomplete snapshot', async () => {
    const input = fixture(), svg = await renderDistributionMap(input);
    expect(svg).toContain('全47都道府県');
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
    await expect(renderDistributionMap({ ...input, data: input.data.slice(0, 46) })).rejects.toThrow();
  });
  it('draws the dark theme with light grey prefecture borders on grey paper, same fills', async () => {
    const light = await renderDistributionMap(fixture()), dark = await renderDistributionMap(fixture(), CHART_THEMES.dark);
    const fills = (svg: string) => [...svg.matchAll(/data-pref="(\d+)" data-value="[^"]+" d="[^"]+" fill="([^"]+)"/g)].map((m) => m[1] + m[2]);
    expect(fills(dark)).toEqual(fills(light));
    expect(dark).toContain(`stroke="${CHART_THEMES.dark.mapBorder}" stroke-width="1.6"`);
    expect(dark).not.toContain('stroke="#FFFFFF"');
    expect(dark).toContain(`fill="${CHART_THEMES.dark.paper}"`);
  });
});
