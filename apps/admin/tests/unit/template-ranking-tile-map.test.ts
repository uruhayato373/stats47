import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRankingTileMap } from '@/lib/template-ranking-tile-map';
const names = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
// Synthetic values test code-to-prefecture mapping; live data stays in the SHA-verified R2 snapshot.
const fixture = () => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃',
  data: Array.from({ length: 47 }, (_, i) => ({
    rank: i + 1, area_code: String((i + 42) % 47 + 1).padStart(2, '0') + '000',
    area_name: names[(i + 42) % 47], year: '2024', value: 36.2 - i * 0.25,
  })),
});
function tile(svg: string, name: string) {
  const group = svg.split('<g aria-label="' + name + ' ')[1]?.split('</g>')[0];
  expect(group).toBeTruthy();
  const rect = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(group!);
  expect(rect).toBeTruthy();
  return { x: Number(rect![1]), y: Number(rect![2]), w: Number(rect![3]), h: Number(rect![4]), group: group! };
}
describe('published-layout tile-map basic form', () => {
  it('keeps the published island separation and prefecture spans instead of packing equal squares', async () => {
    const svg = await renderRankingTileMap(fixture());
    expect(svg.match(/<g aria-label="/g)).toHaveLength(47);
    const hokkaido = tile(svg, '北海道'), iwate = tile(svg, '岩手県');
    expect(hokkaido.w).toBeGreaterThan(iwate.w);
    expect(hokkaido.h).toBeGreaterThan(iwate.h);
    expect(tile(svg, '岐阜県').h).toBeGreaterThan(iwate.h);
    expect(tile(svg, '新潟県').w).toBeGreaterThan(iwate.w);
    const okinawa = tile(svg, '沖縄県'), kagoshima = tile(svg, '鹿児島県');
    expect(okinawa.y).toBeGreaterThan(kagoshima.y + kagoshima.h + iwate.h);
    expect(tile(svg, '神奈川県').y).toBeGreaterThan(tile(svg, '東京都').y);
    expect(tile(svg, '香川県').y).toBeGreaterThan(tile(svg, '岡山県').y);
  }, 20000); // First render also loads the site's D3 scale implementation.
  it('joins all values by prefecture code regardless of ranking order', async () => {
    const input = fixture();
    const svg = await renderRankingTileMap({ ...input, data: [...input.data].reverse() });
    for (const row of input.data) expect(tile(svg, row.area_name).group).toContain(row.value.toFixed(1) + '℃');
    expect(new Set(names.map((name) => tile(svg, name).x + ':' + tile(svg, name).y)).size).toBe(47);
  });
  it('renders a 4:5 PNG using the published renderer and rejects an incomplete snapshot', async () => {
    const input = fixture(), svg = await renderRankingTileMap(input);
    expect(svg).toContain('全47都道府県');
    expect(svg).toContain('境界：');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
    const heading = await sharp(png).extract({ left: 64, top: 120, width: 750, height: 100 }).stats();
    expect(heading.channels[0].min).toBeLessThan(100);
    await expect(renderRankingTileMap({ ...input, data: input.data.slice(0, 46) })).rejects.toThrow();
  });
});
