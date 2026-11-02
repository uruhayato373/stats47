import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderDistributionMap } from '@/lib/template-distribution-map';
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
  it('renders a 4:5 PNG with a legend and minimal copy, and rejects an incomplete snapshot', async () => {
    const input = fixture(), svg = await renderDistributionMap(input);
    expect(svg).toContain('全47都道府県');
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
    await expect(renderDistributionMap({ ...input, data: input.data.slice(0, 46) })).rejects.toThrow();
  });
});
