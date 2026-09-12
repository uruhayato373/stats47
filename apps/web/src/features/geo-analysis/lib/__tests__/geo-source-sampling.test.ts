import { describe, expect, it } from 'vitest';

import { sampleGeoSourceFeatures } from '../geo-source-sampling';

describe('map drawing limit', () => {
  it('represents the beginning, middle and end of the selected area', () => {
    const records = Array.from({ length: 10_001 }, (_, index) => index);
    expect(sampleGeoSourceFeatures(records, () => true, 3)).toEqual({
      matched: 10_001,
      selected: [0, 5_000, 10_000],
    });
  });
  it('counts only visible features and keeps all when zooming below the limit', () => {
    expect(
      sampleGeoSourceFeatures([0, 1, 2, 3, 4], (value) => value >= 2, 3)
    ).toEqual({ matched: 3, selected: [2, 3, 4] });
    expect(sampleGeoSourceFeatures([0], () => false, 3)).toEqual({
      matched: 0,
      selected: [],
    });
    expect(sampleGeoSourceFeatures([0], () => true, 3)).toEqual({
      matched: 1,
      selected: [0],
    });
  });
});
