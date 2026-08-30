import fs from 'node:fs';

import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';

import { computeBuzzMapGeo } from '../../buzz-map/geo';

import {
  GEO_X_CANVAS,
  GEO_X_EXCLUSIVE_REGION_PAIRS,
  GEO_X_LAYOUT,
  GEO_X_MAP_TRANSFORMS,
  rectContains,
  rectsOverlap,
  transformMapRect,
} from '../layout';

function pathBounds(path: string) {
  const points = [...path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])] as const,
  );
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

describe('Geo X layout contract', () => {
  it('すべての描画領域が1080x1350の安全領域に収まる', () => {
    const canvas = { x: 0, y: 0, ...GEO_X_CANVAS };
    for (const rect of Object.values(GEO_X_LAYOUT)) {
      expect(rectContains(canvas, rect)).toBe(true);
    }
  });

  it('本文領域・地図・凡例・結論・フッターを重ねない', () => {
    for (const [leftName, rightName] of GEO_X_EXCLUSIVE_REGION_PAIRS) {
      expect(
        rectsOverlap(GEO_X_LAYOUT[leftName], GEO_X_LAYOUT[rightName]),
        `${leftName} overlaps ${rightName}`,
      ).toBe(false);
    }
  });

  it('沖縄インセットを地図領域の中だけに置く', () => {
    expect(rectContains(GEO_X_LAYOUT.mapStage, GEO_X_LAYOUT.okinawaInset)).toBe(
      true,
    );
  });

  it('実際の本土地図と沖縄インセットを重ねない', () => {
    const topology = JSON.parse(
      fs.readFileSync(
        new URL('../../../../public/prefecture.topojson', import.meta.url),
        'utf8',
      ),
    ) as Topology;
    const geo = computeBuzzMapGeo(topology, null, {
      level: 'pref',
      ratio: '45',
      type: 'A',
    });
    expect(geo.insetBox).not.toBeNull();
    const box = geo.insetBox;
    if (!box) return;
    const insetRect = transformMapRect(
      {
        x: box.x - 6,
        y: box.y - 6,
        width: box.width + 12,
        height: box.height + 12,
      },
      GEO_X_MAP_TRANSFORMS.inset,
    );

    for (const prefecture of geo.mainland) {
      const mainlandRect = transformMapRect(
        pathBounds(prefecture.d),
        GEO_X_MAP_TRANSFORMS.mainland,
      );
      expect(
        rectsOverlap(mainlandRect, insetRect),
        `${prefecture.name} overlaps Okinawa inset`,
      ).toBe(false);
    }
  });

  it('通し番号・役割チップ・content keyを視覚要素へ戻さない', () => {
    const source = fs.readFileSync(
      new URL('../GeoInsightCard.tsx', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('ROLE_LABELS');
    expect(source).not.toContain('sequence');
    expect(source).not.toContain('postKey');
  });
});
