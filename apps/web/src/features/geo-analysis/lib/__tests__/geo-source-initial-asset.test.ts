import { describe, expect, it } from 'vitest';

import { findGeoSourceInitialAsset } from '../geo-source-initial-asset';

const asset = (file: string, bytes: number) => ({
  key: `gis/mlit-ksj/L03-a/21/${file}.topojson`,
  label: file,
  bytes,
});

describe('initial GIS map', () => {
  it('opens a mainland mesh instead of the first remote ocean tile', () => {
    const ocean = asset('3036', 6042);
    const mainland = asset('5339', 246692);
    expect(findGeoSourceInitialAsset([ocean, mainland])).toBe(mainland);
  });
  it('never automatically downloads oversized or unknown-size files', () => {
    expect(
      findGeoSourceInitialAsset([asset('5339', 8_000_000), asset('13', 0)])
    ).toBeNull();
  });
  it('uses a small available file when the preferred region is too large', () => {
    const small = asset('14', 200_000);
    expect(findGeoSourceInitialAsset([asset('5339', 20_000_000), small])).toBe(
      small
    );
  });
  it('selects a prefecture file when no mesh preview exists, without changing catalog order', () => {
    const aichi = asset('23', 200_000);
    const tokyo = asset('13', 300_000);
    const assets = [aichi, tokyo];
    expect(findGeoSourceInitialAsset(assets)).toBe(tokyo);
    expect(assets).toEqual([aichi, tokyo]);
  });
});
