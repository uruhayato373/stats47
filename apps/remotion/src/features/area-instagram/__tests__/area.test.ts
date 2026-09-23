import { describe, expect, it } from 'vitest';

import sample from '../../../fixtures/area-carousel-sample.json';
import { AreaCarouselSpecSchema, resolveAreaCarousel, type AreaCarouselSpec } from '../area';

const spec: AreaCarouselSpec = AreaCarouselSpecSchema.parse(sample);
const withSpec = (patch: Partial<AreaCarouselSpec>): AreaCarouselSpec => ({ ...spec, ...patch });

describe('AreaCarouselSpecSchema', () => {
  it('サンプルをそのまま検証できる', () => {
    expect(() => AreaCarouselSpecSchema.parse(sample)).not.toThrow();
  });

  it('順位が欠けている項目があると拒否する', () => {
    const broken = {
      ...sample,
      groups: [
        { ...sample.groups[0], items: [{ ...sample.groups[0].items[0], rank: undefined }] },
        sample.groups[1],
      ],
    };
    expect(() => AreaCarouselSpecSchema.parse(broken)).toThrow();
  });

  it('出典が空文字の項目があると拒否する', () => {
    const broken = {
      ...sample,
      groups: [
        { ...sample.groups[0], items: [{ ...sample.groups[0].items[0], source: '' }] },
        sample.groups[1],
      ],
    };
    expect(() => AreaCarouselSpecSchema.parse(broken)).toThrow();
  });

  it('グループが2つでないと拒否する', () => {
    expect(() => AreaCarouselSpecSchema.parse({ ...sample, groups: [sample.groups[0]] })).toThrow();
  });
});

describe('resolveAreaCarousel', () => {
  it('矛盾のない spec は解決できる', () => {
    const resolved = resolveAreaCarousel(spec);
    expect(resolved.topGroup.title).toBe('全国トップクラス');
    expect(resolved.bottomGroup.title).toBe('全国では下位');
    expect(resolved.sourceLines.length).toBeGreaterThan(0);
  });

  it('canonicalUrl に areaCode が含まれないと拒否する', () => {
    expect(() =>
      resolveAreaCarousel(withSpec({ canonicalUrl: 'https://stats47.jp/areas/13000' })),
    ).toThrow(/canonicalUrl/);
  });

  it('areaCode の先頭2桁が prefCode と一致しないと拒否する', () => {
    expect(() => resolveAreaCarousel(withSpec({ prefCode: '13' }))).toThrow(/prefCode/);
  });

  it('2グループの見出しが同じだと拒否する', () => {
    const [top, bottom] = spec.groups;
    expect(() =>
      resolveAreaCarousel(withSpec({ groups: [top, { ...bottom, title: top.title }] })),
    ).toThrow(/見出しが同じ/);
  });

  it('teaser がトップグループに含まれないと拒否する', () => {
    expect(() =>
      resolveAreaCarousel(
        withSpec({ teaser: { rankingKey: 'not-in-group', label: 'ダミー', rank: 1, value: 1, unit: '件' } }),
      ),
    ).toThrow(/トップグループ/);
  });

  it('出典×年の重複を1行にまとめる (山形サンプルは家計調査2件が同じ行になる)', () => {
    const resolved = resolveAreaCarousel(spec);
    const kakeiLines = resolved.sourceLines.filter((line) => line.includes('家計調査'));
    expect(kakeiLines).toEqual(['総務省「家計調査」（2024年）']);
  });
});
