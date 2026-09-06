import { describe, expect, it } from 'vitest';
import {
  FLOOD_ARCHIVES,
  assertFloodArchiveKeys,
  parseFloodArchiveCatalog,
} from '../flood-inputs';

describe('洪水の河川区分と災害規模を混同させない', () => {
  it('2025年の公式入力は河川区分10の107件と20の94件', () => {
    expect(FLOOD_ARCHIVES.filter((a) => a.riverClass === '10')).toHaveLength(
      107
    );
    expect(FLOOD_ARCHIVES.filter((a) => a.riverClass === '20')).toHaveLength(
      94
    );
    const html = FLOOD_ARCHIVES.map((a) => `<a href="${a.url}">data</a>`).join(
      ''
    );
    expect(parseFloodArchiveCatalog(html + html)).toEqual(FLOOD_ARCHIVES);
    expect(() =>
      parseFloodArchiveCatalog(
        `${html}/ksj/gml/data/A31b/A31b-25/A31b-25_30_5339_GEOJSON.zip`
      )
    ).toThrow();
  });
  it('旧94件・同数の別メッシュへのすり替え・重複を拒否する', () => {
    expect(() =>
      assertFloodArchiveKeys(
        FLOOD_ARCHIVES.filter((a) => a.riverClass === '20').map((a) => a.key)
      )
    ).toThrow();
    const keys = FLOOD_ARCHIVES.map((a) => a.key);
    expect(() =>
      assertFloodArchiveKeys([keys[0], ...keys.slice(1, -1), keys[0]])
    ).toThrow();
    expect(() =>
      assertFloodArchiveKeys([
        'gis/mlit-ksj/A31b/25/source/10/9999.zip',
        ...keys.slice(1),
      ])
    ).toThrow();
    expect(() =>
      parseFloodArchiveCatalog(
        FLOOD_ARCHIVES.filter((a) => a.riverClass === '20')
          .map((a) => a.url)
          .join('\n')
      )
    ).toThrow();
  });
  it('同じ一次メッシュでも原典キーは別、ZIP内は両方とも想定最大規模20', () => {
    const a = FLOOD_ARCHIVES.find(
      (a) => a.riverClass === '10' && a.meshCode === '5339'
    )!;
    const b = FLOOD_ARCHIVES.find(
      (a) => a.riverClass === '20' && a.meshCode === '5339'
    )!;
    expect(a.key).not.toBe(b.key);
    expect(a.hazardScale).toBe('20');
    expect(b.hazardScale).toBe('20');
    expect(a.entrySuffix).toBe('A31b-20-25_10_5339.geojson');
    expect(b.entrySuffix).toBe('A31b-20-25_20_5339.geojson');
  });
});
