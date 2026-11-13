import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderCompositionHeatmap, renderCompositionPie, renderDistributionBoxplot, renderDonutChart } from '@/lib/template-minor-charts';
import { RANKING_SAMPLE_METRIC } from '@/lib/template-ranking-data';
import { resolveMetricColor } from '../../../remotion/src/features/data-cards/tile-scale';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

// Synthetic values check the renderer contracts; the live samples use the SHA-verified R2 inputs.
const labels = ['ビール', '発泡酒', 'リキュール・その他の醸造酒等', '焼酎', '清酒', '果実酒', 'ウイスキー・ブランデー', 'その他'];
const liquor = () => ({
  title: '酒類別の販売（消費）数量の構成比', unit: '%', valueUnit: '千kL', normalized: true,
  series: labels.map((label, i) => ({
    label,
    data: ['2008年度', '2013年度', '2018年度'].map((year, j) => ({ year, value: 100 + i * 20 + j })),
  })),
});
const temperatures = () => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃',
  // Two far-low values become outliers beyond 1.5 × IQR; the rest spread evenly.
  data: Array.from({ length: 47 }, (_, i) => ({
    rank: i + 1, area_code: String(i + 1).padStart(2, '0') + '000', area_name: '県' + (i + 1), year: '2024',
    value: i < 45 ? 36 - i * 0.05 : 20 - i * 0.1,
  })),
});
const png = async (svg: string) => sharp(await sharp(Buffer.from(svg)).png().toBuffer()).metadata();

describe('使用例の少ない統計図の見本', () => {
  it('box plot shows all 47 values, names the outliers and uses the metric colour', async () => {
    const svg = renderDistributionBoxplot(temperatures());
    expect(svg.match(/data-area="/g)).toHaveLength(47);
    expect(svg.match(/data-outlier="/g)).toHaveLength(2);
    expect(svg).toContain('>県46</text>');
    expect(svg).toContain(`stroke="${resolveMetricColor(RANKING_SAMPLE_METRIC.visualization)}"`);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    expect(await png(svg)).toMatchObject({ width: 1080, height: 1350 });
  });
  it('pie shows the latest year with every category once in the legend and shares summing to 100', async () => {
    const svg = renderCompositionPie(liquor());
    expect(svg.match(/<path data-category="/g)).toHaveLength(8);
    for (const label of labels) expect(svg.split(`>${label}</text>`).length - 1).toBe(1);
    const legendShares = [...svg.matchAll(/text-anchor="end" font-size="26" font-weight="700">([\d.]+)%</g)].map((m) => Number(m[1]));
    expect(legendShares).toHaveLength(8);
    expect(Math.abs(legendShares.reduce((a, b) => a + b, 0) - 100)).toBeLessThan(0.5);
    expect(svg).toContain('>2018年度</text>');
    expect(await png(svg)).toMatchObject({ width: 1080, height: 1350 });
  });
  it('heatmap has one cell per category and year, each with its share', async () => {
    const svg = renderCompositionHeatmap(liquor());
    expect(svg.match(/<g data-category="/g)).toHaveLength(8);
    expect(svg.match(/font-size="34" font-weight="700"[^>]*>[\d.]+%<\/text>/g)).toHaveLength(24);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    expect(await png(svg)).toMatchObject({ width: 1080, height: 1350 });
  });
  it('draws any small composition as a donut, with shares that sum to the whole, and refuses too many parts', () => {
    const chart = { title: '豊田市の業種別内訳', meta: '2023年', source: 'e-Stat', centerLabel: '豊田市',
      categories: [{ label: '輸送用機械', value: 934 }, { label: '電気機械', value: 22 }, { label: 'その他', value: 44 }] };
    const svg = renderDonutChart(chart);
    expect(svg).toContain('data-image-template="pie"');
    expect(svg.match(/data-category="/g)).toHaveLength(3);
    for (const share of ['93.4%', '2.2%', '4.4%']) expect(svg).toContain(`>${share}</text>`);
    // A part under 0.05% is not written as 0.0%, which would read as nothing.
    expect(renderDonutChart({ ...chart, categories: [...chart.categories, { label: '秘匿', value: 0.3 }] })).toContain('>0.1%未満</text>');
    expect(() => renderDonutChart({ ...chart, categories: Array.from({ length: 9 }, (_, i) => ({ label: `区分${i}`, value: 1 })) })).toThrow();
    expect(() => renderDonutChart({ ...chart, categories: [{ label: 'a', value: 0 }, { label: 'b', value: 0 }] })).toThrow();
  });
});
