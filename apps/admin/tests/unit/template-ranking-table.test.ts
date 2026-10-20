import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRankingTable } from '@/lib/template-ranking-table';

describe('ranking table basic form', () => {
  it('shows the upper ten in three aligned columns without bar-chart geometry', async () => {
    // Synthetic values verify layout only; the live sample uses the SHA-verified real R2 input.
    const data = Array.from({ length: 47 }, (_, i) => ({
      rank: i + 1, area_code: String(i + 1).padStart(2, '0') + '000',
      area_name: '県' + (i + 1), year: '2024', value: 36 - i / 10,
    }));
    const input = { _meta: { rankingKey: 'maximum-temperature', year: 2024 }, unit: '℃', data: [...data].reverse() };
    const svg = renderRankingTable(input);
    for (let rank = 1; rank <= 10; rank++) expect(svg).toContain(`>県${rank}</text>`);
    expect(svg.indexOf('>県1</text>')).toBeLessThan(svg.indexOf('>県10</text>'));
    expect(svg).not.toContain('>県11</text>');
    expect(svg).toContain('>35.1</text>');
    for (const text of ['順位', '都道府県', '最高気温（℃）', '日最高気温の月平均の最高値', '上位10県']) expect(svg).toContain(text);
    expect(svg).not.toContain('を抜粋');
    expect(svg).not.toContain('data-category');
    expect(svg).not.toContain('<rect x="352"');
    expect(svg.match(/text-anchor="end" font-size="12"/g)).toHaveLength(10);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
    expect(input.data).toHaveLength(47);
    expect(() => renderRankingTable({ ...input, data: data.slice(0, 10) })).toThrow();
  });
});
