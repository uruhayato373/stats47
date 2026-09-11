import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../../../data-configs/src/theme-catalog/tsunami-exposure-source',
  async (original) => {
    const source =
      await original<
        typeof import('../../../../../data-configs/src/theme-catalog/tsunami-exposure-source')
      >();
    return {
      TSUNAMI_EXPOSURE_SOURCE: structuredClone(source.TSUNAMI_EXPOSURE_SOURCE),
    };
  }
);

import { LANDSLIDE_EXPOSURE_SOURCE as LANDSLIDE } from '../../../../../data-configs/src/theme-catalog/landslide-exposure-source';
import { TSUNAMI_EXPOSURE_SOURCE as TSUNAMI } from '../../../../../data-configs/src/theme-catalog/tsunami-exposure-source';
import {
  assertKsjPublicAssetsAllowed,
  assertKsjPublicKeysAllowed,
} from '../ksj-publication-guard';
import {
  assertScopedGeoSourcePublication,
  scopedGeoSourcePin,
} from '../scoped-geo-source-publication';

describe('reviewed Geo source publication pins', () => {
  it('keeps bare-key A33/A40 and arbitrary versions blocked', () => {
    for (const key of [
      'gis/mlit-ksj/A33/25/01.zip',
      'gis/mlit-ksj/A40/16/22.zip',
    ])
      expect(() => assertKsjPublicKeysAllowed([key])).toThrow(
        'KSJ public mirror禁止'
      );
    for (const key of [
      'gis/mlit-ksj/A33/25/26.zip',
      'gis/mlit-ksj/A33/24/01.zip',
      'gis/mlit-ksj/A40/99/22.zip',
      'gis/tokushima/tsunami-inundation/2025/99.zip',
    ])
      expect(() => scopedGeoSourcePin(key)).toThrow('未承認');
  });

  it('derives exactly the 46 approved A33 pins and the official permission receipt', () => {
    const approved = LANDSLIDE.prefectures.filter(
      (entry) => entry.publication === 'allowed-with-attribution'
    );
    expect(approved).toHaveLength(46);
    for (const source of approved) {
      const key = `gis/mlit-ksj/A33/25/${source.areaCode.slice(0, 2)}.zip`;
      expect(scopedGeoSourcePin(key)).toMatchObject({
        sha256: source.sha256,
        bytes: source.bytes,
        permissionEvidence: [LANDSLIDE.a33.permissions],
      });
    }
  });

  it('follows every reviewed tsunami hazard from SSOT, including both Hyogo versions', () => {
    const hazards = TSUNAMI.inputs.filter((entry) => entry.kind === 'hazard');
    expect(hazards.length).toBeGreaterThan(1);
    for (const source of hazards) {
      expect(scopedGeoSourcePin(source.publicKey)).toMatchObject({
        sha256: source.sha256,
        bytes: source.bytes,
      });
    }
  });

  it.each(['redistribution', 'evidence-sha', 'evidence-url', 'evidence-empty'])(
    'rejects missing or changed %s permission rather than allowing a dataset',
    (change) => {
      const source = TSUNAMI.inputs.find((entry) => entry.kind === 'hazard')!;
      const original = structuredClone(source);
      try {
        if (change === 'redistribution')
          Reflect.set(source, 'redistributionAllowed', false);
        if (change === 'evidence-empty')
          Reflect.set(source, 'licenseEvidence', []);
        if (change === 'evidence-sha')
          Reflect.set(source, 'licenseEvidence', [
            { url: TSUNAMI.evidence[0].url, sha256: '0'.repeat(64) },
          ]);
        if (change === 'evidence-url')
          Reflect.set(source, 'licenseEvidence', [
            {
              url: 'https://example.invalid/permission',
              sha256: TSUNAMI.evidence[0].sha256,
            },
          ]);
        expect(() => scopedGeoSourcePin(source.publicKey)).toThrow('未承認');
      } finally {
        Object.assign(source, original);
      }
    }
  );

  it.each(['item', 'manifest'])(
    'rejects a stale tsunami %s after source scope advances',
    (name) => {
      const key = `${TSUNAMI.r2Root}/${name}.json`;
      const stale = Buffer.from(
        JSON.stringify({
          schemaVersion: 1,
          definitionVersion:
            'shizuoka-A40-16_tokushima20250912_m250r6-24_P05-22_v1',
          generatedAt: '2026-09-10T16:36:50.278Z',
          rows: [],
          inputs: [],
          evidence: [],
        })
      );
      expect(() => assertKsjPublicAssetsAllowed([key], () => stale)).toThrow();
    }
  );

  it('rejects changed source bytes even for an approved exact key', () => {
    for (const key of [
      'gis/mlit-ksj/A33/25/01.zip',
      ...TSUNAMI.inputs
        .filter((entry) => entry.kind === 'hazard')
        .map((entry) => entry.publicKey),
    ])
      expect(() =>
        assertScopedGeoSourcePublication(
          key,
          Buffer.from('not the approved archive')
        )
      ).toThrow('byte/SHA不一致');
  });
});
