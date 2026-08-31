import { describe, expect, it } from 'vitest';

import { inspectPublishedScope } from '../published-scope';

const prefix = 'gis/mlit-ksj/A09/18/08';
const manifestKey = `${prefix}/manifest.json`;
const dataKey = `${prefix}/data.topojson`;

describe('inspectPublishedScope', () => {
  it('skips an exact complete scope', () => {
    expect(
      inspectPublishedScope({
        prefix,
        manifestKey,
        manifest: { files: [{ key: dataKey }] },
        remoteKeys: new Set([manifestKey, dataKey]),
      })
    ).toEqual({ action: 'skip', staleKeys: [] });
  });

  it('identifies undeclared legacy objects for exact cleanup', () => {
    const legacyKey = `${prefix}/08201.topojson`;
    expect(
      inspectPublishedScope({
        prefix,
        manifestKey,
        manifest: { files: [{ key: dataKey }] },
        remoteKeys: new Set([manifestKey, dataKey, legacyKey]),
      })
    ).toEqual({ action: 'skip', staleKeys: [legacyKey] });
  });

  it('reacquires the whole scope when a declared object is missing', () => {
    expect(
      inspectPublishedScope({
        prefix,
        manifestKey,
        manifest: { files: [{ key: dataKey }] },
        remoteKeys: new Set([manifestKey]),
      })
    ).toEqual({
      action: 'reacquire',
      deleteKeys: [manifestKey],
      reason: 'manifest宣言objectが欠損: 1',
    });
  });

  it('does not trust an output key outside the scope', () => {
    expect(
      inspectPublishedScope({
        prefix,
        manifestKey,
        manifest: { files: [{ key: 'gis/mlit-ksj/A09/18/09/data.topojson' }] },
        remoteKeys: new Set([manifestKey]),
      }).action
    ).toBe('reacquire');
  });
});
