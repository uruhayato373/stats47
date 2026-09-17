import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { lintResponsiveBarPair, lintSvgSize } from '../svg-lint.mjs';

const desktop = '<svg width="960" height="404" viewBox="0 0 960 404"><text font-size="13">東京都</text></svg>';
const mobile = '<svg width="640" height="960" viewBox="0 0 640 960"><text font-size="20">東京都</text></svg>';

describe('responsive ranking SVG contract', () => {
  it('accepts canonical desktop + mobile editorial variants', () => {
    assert.deepEqual(
      lintResponsiveBarPair('sample-ranking.svg', desktop, mobile),
      { errors: [], warnings: [] },
    );
    assert.deepEqual(lintSvgSize('sample-ranking-mobile.svg', mobile), {
      errors: [],
      warnings: [],
    });
  });

  it('rejects a missing mobile variant', () => {
    const result = lintResponsiveBarPair('sample-ranking.svg', desktop, null);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /sample-ranking-mobile\.svg/);
  });

  it('rejects mobile labels below the readability floor', () => {
    const result = lintResponsiveBarPair(
      'sample-ranking.svg',
      desktop,
      mobile.replace('font-size="20"', 'font-size="12"'),
    );
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /基準 20px 未満/);
  });
});
