import { describe, expect, it } from 'vitest';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { renderRankingBars } from '@/lib/template-ranking-bars';
import { renderRankingTable } from '@/lib/template-ranking-table';
import { renderRankingTileMap } from '@/lib/template-ranking-tile-map';

describe('shared minimum chart-copy policy', () => {
  it.each([
    'タイルの大きさは面積・人口・気温の大小を表しません',
    'タイルは都道府県の位置を簡略化した模式図',
    '色が濃いほど値が大きい',
    '47都道府県のうち上位10県を抜粋',
    '都道府県統計',
    '画像をクリックすると原寸で開きます',
  ])('rejects reintroduced explanatory text: %s', (text) => {
    expect(() => assertMinimalChartCopy('<svg><text>' + text + '</text></svg>')).toThrow();
  });
  it('allows essential statistical conditions and keeps detailed metadata outside the image', () => {
    expect(() => assertMinimalChartCopy('<svg><desc>タイルは模式図</desc><text>2024年・二人以上の世帯・上位5県</text><text>日最高気温の月平均の最高値</text><text>基準：47市平均 = 1.00</text><text>出典：総務省統計局</text></svg>')).not.toThrow();
  });
  it.each([renderRankingBars, renderRankingTable, renderRankingTileMap])('keeps all ranking samples concise without removing units, year, source or definition', async (render) => {
    const svg = await render({
      _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃',
      data: Array.from({ length: 47 }, (_, i) => ({ rank: i + 1, area_code: String(i + 1).padStart(2, '0') + '000', area_name: '県' + i, year: '2024', value: 36 - i / 10 })),
    });
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    for (const required of ['2024年', '℃', '日最高気温の月平均の最高値', '出典：']) expect(svg).toContain(required);
    expect(svg.match(/出典：/g)).toHaveLength(1);
  });
});
