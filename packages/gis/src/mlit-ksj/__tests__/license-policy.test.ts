import { describe, expect, it } from 'vitest';

import {
  assertKsjPublicStructuredOutputAllowed,
  getKsjLicensePolicy,
} from '../license-policy';

describe('KSJ license policy', () => {
  it('allows CC BY and commercial-ok structured outputs with attribution', () => {
    for (const license of ['cc-by-4.0', 'commercial-ok'] as const) {
      expect(getKsjLicensePolicy(license)).toEqual({
        sourcePublication: 'public-r2-eligible',
        commercialUse: 'allowed-with-attribution',
        publicStructuredOutputAllowed: true,
        attributionRequired: true,
      });
      expect(() =>
        assertKsjPublicStructuredOutputAllowed({
          dataId: 'X00',
          license,
          output: 'app/geo/example/item.json',
        })
      ).not.toThrow();
    }
  });

  it('keeps non-commercial source data local and blocks public databases', () => {
    expect(getKsjLicensePolicy('non-commercial')).toEqual({
      sourcePublication: 'local-only',
      commercialUse: 'spatial-result-only',
      publicStructuredOutputAllowed: false,
      attributionRequired: true,
    });
    expect(() =>
      assertKsjPublicStructuredOutputAllowed({
        dataId: 'W01',
        license: 'non-commercial',
        output: 'app/stats/dam-count/values.json',
      })
    ).toThrow(/W01.*公開構造化データ/);
  });

  it('fails closed for partial and unknown licenses', () => {
    expect(getKsjLicensePolicy('cc-by-4.0-partial').commercialUse).toBe(
      'manual-review'
    );
    expect(getKsjLicensePolicy(undefined).sourcePublication).toBe('unassessed');
    expect(() =>
      assertKsjPublicStructuredOutputAllowed({
        dataId: 'A10',
        license: 'cc-by-4.0-partial',
        output: 'app/geo/example/item.json',
      })
    ).toThrow();
  });
});
