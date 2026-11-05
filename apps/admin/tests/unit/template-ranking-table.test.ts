import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { renderRankingTable } from '@/lib/template-ranking-table';

describe('ranking table basic form', () => {
  // Synthetic values verify layout only; the live sample uses the real R2 input.
  const data = Array.from({ length: 47 }, (_, i) => ({
    rank: i + 1, area_code: String(i + 1).padStart(2, '0') + '000',
    area_name: '県' + (i + 1), year: '2024', value: 36 - i / 10,
  }));
  const input = { _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃', data: [...data].reverse() };

  it('全 47 都道府県を順位の順に 2 列で描き、棒の形を持たない', async () => {
    const svg = renderRankingTable(input);
    expect(svg.match(/data-rank="/g)).toHaveLength(47);
    expect(svg.indexOf('>県1</text>')).toBeLessThan(svg.indexOf('>県47</text>'));
    expect(svg.match(/>都道府県<\/text>/g)).toHaveLength(2);
    expect(svg).toContain('data-image-template="table"');
    expect(svg).not.toContain('data-bar-value');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
  });
  it('左の列は 24 行で、25 位から右の列に続く', () => {
    const svg = renderRankingTable(input);
    const xOf = (name: string) => Number(new RegExp(`<text x="([\\d.]+)"[^>]*>${name}</text>`).exec(svg)![1]);
    expect(xOf('県24')).toBe(xOf('県1'));
    expect(xOf('県25')).toBeGreaterThan(xOf('県24'));
  });
  it('明暗の両方を描き、余計な注釈を持たない', () => {
    for (const theme of [CHART_THEMES.light, CHART_THEMES.dark]) {
      const svg = renderRankingTable(input, theme);
      expect(svg).toContain(`data-theme="${theme.name}"`);
      expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    }
  });
  it('47 県そろわない入力は止める', () => {
    expect(() => renderRankingTable({ ...input, data: data.slice(0, 10) })).toThrow();
  });
});
