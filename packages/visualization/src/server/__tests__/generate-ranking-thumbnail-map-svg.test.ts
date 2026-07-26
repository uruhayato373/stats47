import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import bundledPrefectureTopology from '../prefecture-topology.generated.json';
import { generatePrefectureOverviewSvg } from '../generate-mini-prefecture-svg';
import {
  generateRankingThumbnailMapSvg,
} from '../generate-ranking-thumbnail-map-svg';

const rows = Array.from({ length: 47 }, (_, index) => ({
  areaCode: `${String(index + 1).padStart(2, '0')}000`,
  value: 47 - index,
  rank: index + 1,
}));

describe('generateRankingThumbnailMapSvg', () => {
  it('同梱TopoJSONはGIS SSOTと一致する', () => {
    const sourceText = readFileSync(
      resolve(process.cwd(), '../gis/data/geoshape/prefecture.topojson'),
      'utf8'
    );
    const sourceHash = createHash('sha256').update(sourceText).digest('hex');

    expect(bundledPrefectureTopology.metadata).toMatchObject({
      'stats47:sourceSha256': sourceHash,
      'stats47:quantization': 500_000,
    });
  });

  it('home overview は本土を回転せず、沖縄を含む47都道府県を描画する', () => {
    const svg = generatePrefectureOverviewSvg();
    const prefectureCodes = Array.from(
      svg.matchAll(/data-pref-code="(\d{2})"/g),
      (match) => match[1]
    );

    expect(svg).toContain('data-map-layout="prefecture-overview"');
    expect(svg).toContain('data-map-rotation="none"');
    expect(svg).toContain('data-okinawa="inset"');
    expect(prefectureCodes).toHaveLength(47);
    expect(new Set(prefectureCodes).size).toBe(47);
    expect(prefectureCodes).toContain('47');
    expect(svg.length).toBeLessThan(100_000);
  });

  it('作業ディレクトリに依存せず同じ地理地図を返す', async () => {
    const originalWorkingDirectory = process.cwd();

    try {
      process.chdir('/tmp');
      vi.resetModules();
      const { generatePrefectureOverviewSvg: generateFromBundledTopology } =
        await import('../generate-mini-prefecture-svg');
      const svg = generateFromBundledTopology();

      expect(svg).toContain('data-map-layout="prefecture-overview"');
      expect(svg).not.toContain('data-map-layout="prefecture-overview-fallback"');
      expect(svg.match(/data-pref-code=/g)).toHaveLength(47);
    } finally {
      process.chdir(originalWorkingDirectory);
    }
  });

  it('全ランキングで本土を時計回りに再配置し、沖縄と凡例を持たない', () => {
    const svg = generateRankingThumbnailMapSvg(rows, {
      idSuffix: 'test',
    });

    expect(svg).toContain('viewBox="0 0 320 190"');
    expect(svg).toContain('data-map-rotation="clockwise-32"');
    expect(svg).toContain('data-okinawa="excluded"');
    expect(svg).not.toContain('沖縄');
    expect(svg).not.toContain('47位');
    expect(svg).not.toContain('linearGradient');

    const coordinates = Array.from(
      svg.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g),
      (match) => [Number(match[1]), Number(match[2])] as const
    );
    const bounds = coordinates.reduce(
      (current, [x, y]) => ({
        minX: Math.min(current.minX, x),
        maxX: Math.max(current.maxX, x),
        minY: Math.min(current.minY, y),
        maxY: Math.max(current.maxY, y),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );
    const renderedWidth = bounds.maxX - bounds.minX;
    const renderedHeight = bounds.maxY - bounds.minY;
    expect(renderedWidth / renderedHeight).toBeGreaterThan(1.4);
  });
});
