import { describe, expect, it } from 'vitest';

import {
  renderGeoSourceThumbnail,
  thumbnailColor,
} from '../geo-source-thumbnail-render';

import type { Feature } from 'geojson';

const polygon: Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36],
        [139, 35],
      ],
      [
        [139.4, 35.4],
        [139.6, 35.4],
        [139.6, 35.6],
        [139.4, 35.6],
        [139.4, 35.4],
      ],
    ],
  },
};

describe('GIS thumbnails preserve source meaning', () => {
  it('keeps polygon holes and fits the same excerpt in both aspect ratios', () => {
    const original = JSON.stringify(polygon);
    for (const [width, height] of [
      [640, 360],
      [256, 256],
    ]) {
      const output = renderGeoSourceThumbnail({
        dataId: 'A16',
        features: [polygon],
        context: [],
        extent: [139, 35, 140, 36],
        width,
        height,
        mesh: false,
      });
      expect(output.visibleFeatures).toBe(1);
      expect(output.svg).toContain('fill-rule="evenodd"');
      expect(output.svg).not.toMatch(/NaN|Infinity/);
      expect(output.svg.match(/M/g)?.length).toBe(2);
      const path = output.svg.match(/<path d="(M[^"]+)"/)?.[1] ?? '';
      const coordinates = [...path.matchAll(/(?:M|L)([-\d.]+),([-\d.]+)/g)].map(
        (m) => [Number(m[1]), Number(m[2])]
      );
      expect(coordinates.length).toBeGreaterThan(4);
      expect(
        coordinates.every(([x, y]) => x > 0 && x < width && y > 0 && y < height)
      ).toBe(true);
    }
    expect(JSON.stringify(polygon)).toBe(original);
  });
  it('rejects empty excerpts instead of producing a plausible empty map', () => {
    expect(() =>
      renderGeoSourceThumbnail({
        dataId: 'A16',
        features: [polygon],
        context: [],
        extent: [135, 34, 136, 35],
        width: 640,
        height: 360,
        mesh: false,
      })
    ).toThrow('no features');
  });
  it('does not draw a dateline-crossing overseas route across Japan', () => {
    const route: Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [170, 35],
          [-170, 35],
        ],
      },
    };
    const output = renderGeoSourceThumbnail({
      dataId: 'S10a',
      features: [route],
      context: [],
      extent: [138, 34, 142, 38],
      width: 640,
      height: 360,
      mesh: false,
    });
    expect(output.svg).not.toMatch(/d="M/);
  });
  it('colors the largest land-use area by its actual field, not object key ordering', () => {
    expect(
      thumbnailColor(
        { ...polygon, properties: { 森林: 1000, 海水域: 200 } },
        'L03-a'
      )
    ).toBe('#56866c');
    expect(
      thumbnailColor(
        { ...polygon, properties: { 森林: 200, 海水域: 1000 } },
        'L03-a'
      )
    ).toBe('#b4dbe5');
    expect(
      thumbnailColor(
        { ...polygon, properties: { 土地利用種別: '0500' } },
        'L03-b'
      )
    ).toBe('#56866c');
  });
  it('distinguishes missing elevation from real zero', () => {
    const color = (value: unknown) =>
      thumbnailColor({ ...polygon, properties: { G04a_002: value } }, 'G04-a');
    expect(color('unknown')).toBe('#d1d5db');
    expect(color(null)).toBe('#d1d5db');
    expect(color('-9999')).toBe('#d1d5db');
    expect(color(0)).toBe('#d5e9d3');
    expect(color(1000)).toBe('#715944');
  });
});
