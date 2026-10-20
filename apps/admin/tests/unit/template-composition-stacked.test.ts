import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { compositionSampleRows, renderCompositionStacked } from '@/lib/template-composition-stacked';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

const labels = ['ビール', '発泡酒', 'リキュール・その他の醸造酒等', '焼酎', '清酒', '果実酒', 'ウイスキー・ブランデー', 'その他'];
const fixture = () => ({
  title: '酒類別の販売（消費）数量の構成比', unit: '%', valueUnit: '千kL', normalized: true,
  series: labels.map((label, i) => ({
    label,
    data: ['2008年度', '2013年度', '2018年度'].map((year, j) => ({ year, value: 100 + i * 20 + j })),
  })),
});

describe('酒類の実統計入力を用いる積み上げ棒見本', () => {
  it('uses all categories and years, preserving values and rendering a single portrait image', async () => {
    const input = fixture();
    const rows = compositionSampleRows(input);
    expect(rows).toHaveLength(24);
    expect(rows.map(row => row.value)).toEqual(input.series.flatMap(s => s.data.map(d => d.value)));
    const svg = renderCompositionStacked(input);
    for (const label of labels) expect(svg).toContain(`>${label}</text>`);
    for (const year of ['2008年度', '2013年度', '2018年度']) expect(svg).toContain(`>${year}</text>`);
    expect(svg).toContain('出典：国税庁「酒のしおり」');
    expect(svg).toContain('>100%</text>');
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350 });
  });
  it.each(['missing', 'duplicate-year', 'duplicate-category', 'negative', 'zero', 'unit'] as const)('rejects %s input', issue => {
    const input = fixture();
    if (issue === 'missing') input.series.pop();
    if (issue === 'duplicate-year') input.series[0].data[1].year = '2008年度';
    if (issue === 'duplicate-category') input.series[0].label = input.series[1].label;
    if (issue === 'negative') input.series[0].data[0].value = -1;
    if (issue === 'zero') input.series.forEach(s => s.data.forEach(d => { d.value = 0; }));
    if (issue === 'unit') input.valueUnit = 'kL';
    expect(() => renderCompositionStacked(input)).toThrow();
  });
});
