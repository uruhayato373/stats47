import { describe, expect, it } from 'vitest';

import {
  isAcquisitionComplete,
  isRequiredPublicAcquisitionMissing,
  publicMirrorPolicyErrors,
  type R2Inventory,
} from '../scripts/build-data-catalog';
import { PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS } from '../official-policy';

function inventory(fileCount: number, completionManifestCount: number): R2Inventory {
  return {
    versions: ['1'],
    fileCount,
    completionManifestCount,
    totalBytes: 100,
    featureCount: null,
    latestModifiedAt: null,
  };
}

describe('isAcquisitionComplete', () => {
  it('locks the audited official acquisition set', () => {
    expect(PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.size).toBe(29);
    expect([...PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.values()].reduce((sum, value) => sum + value, 0)).toBe(1338);
  });

  it('does not treat a partial public acquisition as complete', () => {
    expect(isAcquisitionComplete('A09', inventory(20, 10))).toBe(false);
  });

  it('requires the exact official manifest count', () => {
    expect(isAcquisitionComplete('A09', inventory(92, 46))).toBe(true);
    expect(isAcquisitionComplete('A09', inventory(94, 47))).toBe(false);
  });

  it('keeps the legacy R2-object completion rule for older registered datasets', () => {
    expect(isAcquisitionComplete('N02', inventory(1, 0))).toBe(true);
    expect(isAcquisitionComplete('N02', inventory(0, 0))).toBe(false);
  });
});

describe('publicMirrorPolicyErrors', () => {
  it('公開禁止データの撤去を再取得要求にせず、公開可データの不足は検出する', () => {
    const empty = { registered: true, dataId: 'W01', r2: inventory(0, 0) };
    expect(isRequiredPublicAcquisitionMissing({ ...empty, publicationPolicy: 'local-only' })).toBe(false);
    expect(isRequiredPublicAcquisitionMissing({ ...empty, publicationPolicy: 'review-required' })).toBe(false);
    expect(isRequiredPublicAcquisitionMissing({ ...empty, dataId: 'N02', publicationPolicy: 'public-r2-eligible' })).toBe(true);
  });

  it('fails when a local-only dataset exists in public R2', () => {
    expect(
      publicMirrorPolicyErrors([
        { dataId: 'W01', compliance: { publicMirrorPolicyMismatch: true } },
        { dataId: 'S12', compliance: { publicMirrorPolicyMismatch: false } },
      ]),
    ).toEqual(['公開不可KSJがpublic R2に存在します: W01']);
  });

  it('passes when there are no public mirror mismatches', () => {
    expect(
      publicMirrorPolicyErrors([
        { dataId: 'S12', compliance: { publicMirrorPolicyMismatch: false } },
      ]),
    ).toEqual([]);
  });
});
