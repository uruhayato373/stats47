import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderTreemapChart, squarify } from '@/lib/template-composition-treemap';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { RANKING_SAMPLE_PRESENTATION } from '@/lib/template-ranking-data';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

const items = [
  { label: '豊田市', value: 20527151 },
  { label: '名古屋市', value: 3549111 },
  { label: '岡崎市', value: 3192685 },
  ...Array.from({ length: 51 }, (_, i) => ({ label: `町${i + 1}`, value: 1000 + i * 20000 })),
];
const chart = { title: '愛知県の製造品出荷額等の内訳', meta: '2023年 · 54市町村 · 県内合計に占める割合', source: 'e-Stat 社会・人口統計体系', presentation: RANKING_SAMPLE_PRESENTATION, items };

describe('treemap type', () => {
  it('gives each part an area proportional to its value, tiling the body exactly without overlap', () => {
    const rects = squarify(items, 900, 1000);
    const total = items.reduce((s, i) => s + i.value, 0);
    expect(rects.reduce((s, r) => s + r.w * r.h, 0)).toBeCloseTo(900 * 1000, 2);
    for (const r of rects) expect(r.w * r.h / (900 * 1000)).toBeCloseTo(r.value / total, 6);
    for (const [i, a] of rects.entries())
      for (const b of rects.slice(i + 1)) {
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(ox > 1e-6 && oy > 1e-6).toBe(false);
      }
  });

  it('names large parts with their share, leaves small parts unnamed, and draws one 4:5 image per theme', async () => {
    const svg = renderTreemapChart(chart);
    const total = items.reduce((s, i) => s + i.value, 0);
    expect(svg).toContain('data-image-template="treemap"');
    expect(svg).toContain('>豊田市</text>');
    expect(svg).toContain(`>${(20527151 / total * 100).toFixed(1)}%</text>`);
    expect(svg).not.toContain('>町1</text>');
    expect(svg.match(/data-part="/g)).toHaveLength(items.length);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    for (const theme of Object.values(CHART_THEMES)) {
      const png = await sharp(Buffer.from(renderTreemapChart(chart, theme))).png().toBuffer();
      expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350 });
    }
    expect(renderTreemapChart(chart, CHART_THEMES.dark)).toContain('data-theme="dark"');
  });

  it.each([
    ['zero', [{ label: 'a', value: 1 }, { label: 'b', value: 0 }]],
    ['negative', [{ label: 'a', value: 1 }, { label: 'b', value: -3 }]],
    ['duplicate', [{ label: 'a', value: 1 }, { label: 'a', value: 2 }]],
    ['single', [{ label: 'a', value: 1 }]],
  ])('refuses a %s part instead of hiding it', (_, bad) => {
    expect(() => renderTreemapChart({ ...chart, items: bad })).toThrow();
  });
});
