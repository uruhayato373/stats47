import { buildFloodPrefDetail } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));

import {
  bindFixtureArtifact,
  manifestFixture,
} from '../../lib/__tests__/geo-manifest-fixture';
import { fetchGeoDetailAction } from '../fetch-geo-detail';

function fixture(generatedAt: string) {
  const detail = buildFloodPrefDetail({
    generatedAt,
    areaCode: '13000',
    areaName: '東京都',
    meshes: [
      {
        meshId: '53394525',
        areaCode: '13000',
        longitude: 139.70625,
        latitude: 35.6041665,
        bounds: [139.7, 35.6, 139.7125, 35.608333],
        population2020: 100,
        population2050: 80,
        floodDepthClass: 2,
      },
    ],
  });
  const manifest = bindFixtureArtifact(
    { ...manifestFixture('population-flood-risk'), generatedAt },
    'app/geo/population-flood-risk/pref/13.json',
    detail
  );
  const artifact = manifest.stages[0]!.outputs.find(
    (output) => output.areaCode === '13000'
  )!;
  return {
    detail,
    manifest,
    expected: { generatedAt, sha256: artifact.sha256 },
  };
}

describe('表示中のGeo証跡に固定したserver action', () => {
  it.each([
    ['https://example.com', '13'],
    ['//example.com', '13'],
    ['population-flood-risk/../../private', '13'],
    ['population-flood-risk', '../13'],
    ['population-flood-risk', '13?redirect=https://example.com'],
    ['population-flood-risk', '%31%33'],
    ['population-flood-risk', '13\n'],
  ])('定義外の取得先をR2へ渡さない (%s, %s)', async (slug, pref) => {
    vi.mocked(fetchFromR2AsJson).mockClear();
    expect(await fetchGeoDetailAction(slug, pref, {
      generatedAt: '2026-09-05T00:00:00.000Z',
      sha256: 'a'.repeat(64),
    })).toBeNull();
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });
  it('ページAの表示中に配信がBへ切り替わった場合、Bの地図を混ぜず拒否する', async () => {
    const a = fixture('2026-09-05T00:00:00.000Z');
    const b = fixture('2026-09-06T00:00:00.000Z');
    const fetchMock = vi.mocked(fetchFromR2AsJson);
    fetchMock.mockResolvedValueOnce(b.detail).mockResolvedValueOnce(b.manifest);
    expect(
      await fetchGeoDetailAction('population-flood-risk', '13', a.expected)
    ).toBeNull();
    fetchMock.mockResolvedValueOnce(b.detail).mockResolvedValueOnce(b.manifest);
    expect(
      await fetchGeoDetailAction('population-flood-risk', '13', b.expected)
    ).toEqual(b.detail);
  });
  it('同じ生成時刻でも表示manifestとartifact SHAが異なれば拒否する', async () => {
    const a = fixture('2026-09-05T00:00:00.000Z');
    vi.mocked(fetchFromR2AsJson)
      .mockResolvedValueOnce(a.detail)
      .mockResolvedValueOnce(a.manifest);
    expect(
      await fetchGeoDetailAction('population-flood-risk', '13', {
        ...a.expected,
        sha256: 'b'.repeat(64),
      })
    ).toBeNull();
  });
  it('不正な期待版・県はR2取得前に拒否する', async () => {
    vi.mocked(fetchFromR2AsJson).mockClear();
    expect(
      await fetchGeoDetailAction('population-flood-risk', '48', {
        generatedAt: 'invalid',
        sha256: 'x',
      })
    ).toBeNull();
    expect(
      await fetchGeoDetailAction('population-flood-risk', '13', {
        generatedAt: 'invalid',
        sha256: 'x',
      })
    ).toBeNull();
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });
});
