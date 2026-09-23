import { describe, expect, it } from 'vitest';

import sample from '../../../fixtures/correlation-carousel-sample.json';
import {
  CorrelationCarouselSpecSchema,
  resolveCorrelationCarousel,
  type CorrelationCarouselSpec,
} from '../correlation';

const spec: CorrelationCarouselSpec = CorrelationCarouselSpecSchema.parse(sample);
const withSpec = (patch: Partial<CorrelationCarouselSpec>): CorrelationCarouselSpec => ({ ...spec, ...patch });

describe('CorrelationCarouselSpecSchema', () => {
  it('サンプルをそのまま検証できる', () => {
    expect(() => CorrelationCarouselSpecSchema.parse(sample)).not.toThrow();
  });

  it('points が47件でないと拒否する', () => {
    expect(() => CorrelationCarouselSpecSchema.parse({ ...sample, points: sample.points.slice(0, 46) })).toThrow();
  });

  it('r が範囲外 (|r|>1) だと拒否する', () => {
    expect(() => CorrelationCarouselSpecSchema.parse({ ...sample, r: 1.5 })).toThrow();
  });

  it('highlights の点が prefCode ではなく areaCode フィールドを持つ (生成物の JoinRow 型を踏襲)', () => {
    expect(() =>
      CorrelationCarouselSpecSchema.parse({
        ...sample,
        highlights: { trendAnchors: [{ prefCode: '13', name: '東京都', x: 1, y: 1 }, sample.highlights.trendAnchors[1]], outliers: sample.highlights.outliers },
      }),
    ).toThrow();
  });
});

describe('resolveCorrelationCarousel', () => {
  it('矛盾のない spec は解決できる', () => {
    const resolved = resolveCorrelationCarousel(spec);
    expect(resolved.spec.points).toHaveLength(47);
  });

  it('x.key と y.key が同じだと拒否する', () => {
    expect(() => resolveCorrelationCarousel(withSpec({ y: { ...spec.y, key: spec.x.key } }))).toThrow(/x.key と y.key/);
  });

  it('n が points の件数と一致しないと拒否する', () => {
    expect(() => resolveCorrelationCarousel(withSpec({ n: 46 }))).toThrow(/n \(/);
  });

  it('canonicalUrl.x に x.key が含まれないと拒否する', () => {
    expect(() =>
      resolveCorrelationCarousel(withSpec({ canonicalUrl: { ...spec.canonicalUrl, x: 'https://stats47.jp/ranking/other-key' } })),
    ).toThrow(/canonicalUrl\.x/);
  });

  it('highlights の都道府県が points に無いと拒否する', () => {
    expect(() =>
      resolveCorrelationCarousel(
        withSpec({
          highlights: {
            trendAnchors: [{ areaCode: '99', name: '存在しない県', x: 1, y: 1 }, spec.highlights.trendAnchors[1]!],
            outliers: spec.highlights.outliers,
          },
        }),
      ),
    ).toThrow(/points に含まれていません/);
  });

  it('highlights の都道府県が重複していると拒否する', () => {
    const dup = spec.highlights.trendAnchors[0]!;
    expect(() =>
      resolveCorrelationCarousel(
        withSpec({
          highlights: {
            trendAnchors: [dup, dup],
            outliers: spec.highlights.outliers,
          },
        }),
      ),
    ).toThrow(/重複/);
  });
});
