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
    // ★cwd 相対にすると workspace 一括実行 (cwd = リポジトリ root) で別パスを見て
    //   ENOENT になる。このファイルからの相対で解決する (2026-07-31 是正)。
    const sourceText = readFileSync(
      resolve(__dirname, '../../../../gis/data/geoshape/prefecture.topojson'),
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

    // compact path は `M<x>,<y> <x>,<y> ...Z` 形式で、先頭以外に命令文字を持たない。
    // 輪郭の実際の広がりを見るため、命令文字の有無に関わらず全座標対を読む。
    const coordinates = Array.from(
      svg.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g),
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

  it('compact path で 1枚あたり 100KB 未満に収まり、46都道府県を保つ', () => {
    const svg = generateRankingThumbnailMapSvg(rows, { idSuffix: 'size' });

    // 未簡略化 path の頃は1枚 1.7MB あり、home の RSC payload を肥大させていた。
    expect(new TextEncoder().encode(svg).length).toBeLessThan(100_000);
    expect(svg.match(/<path /g)).toHaveLength(46);
    expect(svg).toContain('viewBox="0 0 320 190"');
    expect(svg).toContain('data-map-rotation="clockwise-32"');
    expect(svg).toContain('data-okinawa="excluded"');
    expect(svg).toContain('data-map-format="compact-v1"');
    expect(svg).not.toMatch(/NaN|undefined/);
  });

  it('同じ入力なら完全に同じ文字列を返す (静的地理の再利用が結果を汚さない)', () => {
    const first = generateRankingThumbnailMapSvg(rows, { idSuffix: 'a' });
    const second = generateRankingThumbnailMapSvg(rows, { idSuffix: 'a' });

    expect(second).toBe(first);
  });

  it('1位リングと配色は順位に追従し、reversed で逆転する', () => {
    // 沖縄(47)は地図から除外されるため、両端が本土に来る01-46で検証する。
    const mainlandRows = rows
      .filter((row) => row.areaCode !== '47000')
      .map((row) => ({ areaCode: row.areaCode, value: row.value }));
    const ascending = generateRankingThumbnailMapSvg(mainlandRows, {
      idSuffix: 'asc',
    });
    const reversed = generateRankingThumbnailMapSvg(mainlandRows, {
      idSuffix: 'rev',
      isReversed: true,
    });
    const greens = generateRankingThumbnailMapSvg(mainlandRows, {
      idSuffix: 'green',
      colorScheme: 'interpolateGreens',
    });

    // 1位だけが強調リングを持つ。
    expect(ascending.match(/stroke="#f59e0b"/g)).toHaveLength(1);
    expect(reversed.match(/stroke="#f59e0b"/g)).toHaveLength(1);
    // reversed は最下位が1位になるため、リングの付く path が入れ替わる。
    const ringIndex = (svg: string) =>
      svg.split('<path ').findIndex((part) => part.includes('#f59e0b'));
    expect(ringIndex(reversed)).not.toBe(ringIndex(ascending));
    // colorScheme は fill だけを変え、地理形状は共有する。
    expect(greens).not.toBe(ascending);
    expect(greens.match(/<path /g)).toHaveLength(46);
  });
});
