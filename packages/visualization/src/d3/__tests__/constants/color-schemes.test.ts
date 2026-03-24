import { describe, it, expect } from 'vitest';
import {
  SEQUENTIAL_COLOR_SCHEMES,
  DIVERGING_COLOR_SCHEMES,
  CATEGORICAL_COLOR_SCHEMES,
  ALL_COLOR_SCHEMES,
  getColorSchemeType,
} from '../../constants/color-schemes';

describe('color-schemes', () => {
  // ALL_COLOR_SCHEMES がすべてのスキームを含む
  it('ALL_COLOR_SCHEMES should contain all defined color schemes', () => {
    const expectedLength =
      SEQUENTIAL_COLOR_SCHEMES.length +
      DIVERGING_COLOR_SCHEMES.length +
      CATEGORICAL_COLOR_SCHEMES.length;
    expect(ALL_COLOR_SCHEMES.length).toBe(expectedLength);

    SEQUENTIAL_COLOR_SCHEMES.forEach((scheme) =>
      expect(ALL_COLOR_SCHEMES).toContain(scheme)
    );
    DIVERGING_COLOR_SCHEMES.forEach((scheme) =>
      expect(ALL_COLOR_SCHEMES).toContain(scheme)
    );
    CATEGORICAL_COLOR_SCHEMES.forEach((scheme) =>
      expect(ALL_COLOR_SCHEMES).toContain(scheme)
    );
  });

  // getColorSchemeType() が正しいタイプを返す
  it('getColorSchemeType should return the correct type for a known scheme value', () => {
    expect(getColorSchemeType('interpolateBlues')).toBe('sequential');
    expect(getColorSchemeType('interpolateRdBu')).toBe('diverging');
    expect(getColorSchemeType('schemeCategory10')).toBe('categorical');
  });

  // 未知のスキーム値でデフォルト 'sequential' を返す
  it('getColorSchemeType should return "sequential" for an unknown scheme value', () => {
    expect(getColorSchemeType('unknownScheme')).toBe('sequential');
    expect(getColorSchemeType('')).toBe('sequential');
  });
});
