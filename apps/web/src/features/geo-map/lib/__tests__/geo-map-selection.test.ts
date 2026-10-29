import { describe, expect, it } from 'vitest';

import { geoMapHref, resolveGeoMapScope, resolveGeoMapSelection } from '../geo-map-selection';

describe('重ね合わせ画面の URL の解釈', () => {
  it('範囲: 全国・地方・県。1 道県の地方 (北海道・沖縄) は県、解釈できない値は null', () => {
    expect(resolveGeoMapScope('national')?.prefCodes).toHaveLength(47);
    expect(resolveGeoMapScope('kanto')).toMatchObject({ kind: 'region', name: '関東' });
    expect(resolveGeoMapScope('hokkaido')).toMatchObject({ kind: 'prefecture', slug: '01' });
    expect(resolveGeoMapScope('22')).toMatchObject({ kind: 'prefecture', name: '静岡県' });
    expect(resolveGeoMapScope('99')).toBeNull();
    expect(resolveGeoMapScope('unknown')).toBeNull();
  });

  it('条件なしは既定の背景・重ねるもの・関東。条件付きは noindex の対象として印を付ける', () => {
    const plain = resolveGeoMapSelection({});
    expect(plain.scope.slug).toBe('kanto');
    expect(plain.base?.id).toBe('municipal-population-change');
    expect(plain.overlays.map((subject) => subject.id)).toEqual(['expressway-sections', 'expressway-joints']);
    expect(plain.hasQuery).toBe(false);
    expect(resolveGeoMapSelection({ scope: 'zzz' })).toMatchObject({ hasQuery: true, scope: { slug: 'kanto' } });
  });

  it('背景は base= の 1 つだけ。base=none で背景なし、重ねるものに塗り分けを書いても背景にはしない', () => {
    expect(resolveGeoMapSelection({ base: 'none', subjects: 'airports' })).toMatchObject({ base: null });
    const mixed = resolveGeoMapSelection({ base: 'municipal-manufacturing-shipment', subjects: 'municipal-population,expressway-sections' });
    expect(mixed.base?.id).toBe('municipal-manufacturing-shipment');
    expect(mixed.overlays.map((subject) => subject.id)).toEqual(['expressway-sections']);
    expect(mixed.dropped).toEqual([{ id: 'municipal-population', reason: 'kind' }]);
  });

  it('URL は base・subjects・scope をこの順で持ち、subjects はカンマ区切りのまま', () => {
    expect(geoMapHref('municipal-population', ['expressway-sections', 'expressway-joints'], '22')).toBe(
      '/geo/map?base=municipal-population&subjects=expressway-sections,expressway-joints&scope=22',
    );
    expect(geoMapHref(null, [], 'national')).toBe('/geo/map?base=none&subjects=&scope=national');
  });
});
