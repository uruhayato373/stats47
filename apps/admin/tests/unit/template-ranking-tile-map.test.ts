import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRankingTileMap } from '@/lib/template-ranking-tile-map';
import { renderAll47TileSvg } from '../../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../../remotion/src/features/data-cards/tile-scale';
import { resolveChoroplethScale } from '../../../../packages/visualization/src/server';
import { RANKING_SAMPLE_METRIC } from '@/lib/template-ranking-data';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
const names = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
// Synthetic values test code-to-prefecture mapping; live data stays in the SHA-verified R2 snapshot.
const fixture = () => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃',
  data: Array.from({ length: 47 }, (_, i) => ({
    rank: i + 1, area_code: String((i + 42) % 47 + 1).padStart(2, '0') + '000',
    area_name: names[(i + 42) % 47], year: '2024', value: 36.2 - i * 0.25,
  })),
});
function tile(svg: string, code: string) {
  const match = new RegExp(`<g transform="translate\\(([\\d.]+),([\\d.]+)\\)" data-area="${code}" data-value="([^"]+)"><rect width="([\\d.]+)" height="([\\d.]+)"`).exec(svg);
  expect(match).toBeTruthy();
  return { x: Number(match![1]), y: Number(match![2]), value: Number(match![3]), w: Number(match![4]), h: Number(match![5]) };
}
describe('compact tile-map basic form (4:5 images)', () => {
  it('uses the shared renderer with the metric colour scale, top three and a bounded legend', async () => {
    const input = fixture();
    const svg = await renderRankingTileMap(input);
    const plain = renderAll47TileSvg(
      input.data.map((r) => ({ areaCode: r.area_code, areaName: r.area_name, value: r.value })),
      { title: '最高気温', year: '2024年', unit: '℃', source: '社会・人口統計体系', note: '日最高気温の月平均の最高値' }
    );
    // Same layout and copy as the shared renderer; only the fills differ (metric scale vs default blue).
    // Legend rows carry each scale's own ranges and counts, so they are checked separately below.
    const strip = (s: string) => s.replace(/<g data-legend-row="\d+">.*?<\/g>/g, '').replace(/fill="[^"]+"/g, '');
    expect(strip(svg).replace(/<text[^>]*>[\d.,]+<\/text>/g, '')).toBe(strip(plain).replace(/<text[^>]*>[\d.,]+<\/text>/g, ''));
    expect(svg).not.toBe(plain);
    expect(svg.match(/data-top="/g)?.length).toBeGreaterThanOrEqual(3);
    expect(svg).toContain('上位3県');
    // One legend row per class (colour, range, number of prefectures); the counts cover all 47.
    const scale = resolveTileScale(RANKING_SAMPLE_METRIC.visualization, input.data.map((r) => r.value))!;
    const counts = [...svg.matchAll(/<g data-legend-row="\d+">.*?>(\d+)県<\/text><\/g>/g)].map((m) => Number(m[1]));
    expect(counts).toHaveLength(scale.colors.length);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(47);
  });
  it('keeps the archipelago shape of the site layout with every prefecture joined by code', async () => {
    const input = fixture();
    const svg = await renderRankingTileMap({ ...input, data: [...input.data].reverse() });
    expect(svg.match(/data-area="/g)).toHaveLength(47);
    for (const row of input.data) expect(tile(svg, row.area_code).value).toBe(row.value);
    expect(new Set(input.data.map((row) => { const t = tile(svg, row.area_code); return t.x + ':' + t.y; })).size).toBe(47);
    // Shape from the site layout: Hokkaido 2×2, wide Niigata, tall Gifu, Okinawa apart from Kyushu.
    const hokkaido = tile(svg, '01000'), iwate = tile(svg, '03000');
    expect(hokkaido.w).toBeGreaterThan(iwate.w * 1.8);
    expect(hokkaido.h).toBeGreaterThan(iwate.h * 1.8);
    expect(tile(svg, '15000').w).toBeGreaterThan(iwate.w * 1.8);
    expect(tile(svg, '21000').h).toBeGreaterThan(iwate.h * 1.8);
    const kagoshima = tile(svg, '46000'), okinawa = tile(svg, '47000');
    expect(okinawa.y).toBeGreaterThan(kagoshima.y + kagoshima.h);
    // Blank strait rows are compressed, so tiles are larger than in the uncompressed 14×16 grid (~62px).
    expect(iwate.w).toBeGreaterThan(62);
  });
  it('resolves tile colours exactly like the ranking page (sync resolver vs resolveChoroplethScale)', async () => {
    const values = fixture().data.map((r) => r.value);
    const site = await resolveChoroplethScale(RANKING_SAMPLE_METRIC.visualization, values.map((value, i) => ({ areaCode: String(i), value })));
    const tiles = resolveTileScale(RANKING_SAMPLE_METRIC.visualization, values)!;
    expect(tiles.colors).toEqual(site.colors);
    expect(tiles.boundaries).toEqual(site.boundaries);
    for (const value of values) expect(tiles.colorAt(value)).toBe(site.colorAtValue(value));
  });
  it('renders a 4:5 PNG and rejects an incomplete snapshot', async () => {
    const input = fixture(), svg = await renderRankingTileMap(input);
    expect(svg).not.toContain('stats47');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
    await expect(renderRankingTileMap({ ...input, data: input.data.slice(0, 46) })).rejects.toThrow();
  });
  it('draws the dark theme with the same tiles, outlined tiles and swatches on grey paper', async () => {
    const input = fixture();
    const light = await renderRankingTileMap(input), dark = await renderRankingTileMap(input, CHART_THEMES.dark);
    const fills = (svg: string) => [...svg.matchAll(/data-area="(\d+)" data-value="[^"]+"><rect [^>]*fill="([^"]+)"/g)].map((m) => m[1] + m[2]);
    expect(fills(dark)).toEqual(fills(light));
    expect(dark.match(new RegExp(`stroke="${CHART_THEMES.dark.outline}"`, 'g'))!.length).toBeGreaterThanOrEqual(47 + 5);
    expect(dark).toContain(`<rect width="1080" height="1350" fill="${CHART_THEMES.dark.paper}"/>`);
    expect(light).not.toContain('stroke=');
  });
});
