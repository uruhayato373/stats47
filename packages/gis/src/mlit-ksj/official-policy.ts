import data from '../../../../data/geo/ksj/official-policy.json';
import type { KsjLicense } from './types';

export type KsjOfficialPolicy = {
  license: KsjLicense;
  publicR2Eligible: boolean;
  decision: 'acquire' | 'license-review' | 'local-only';
  verifiedAt: string;
  verifiedFrom: string;
};

function makePolicy(
  license: KsjLicense,
  decision: KsjOfficialPolicy['decision']
): KsjOfficialPolicy {
  return {
    license,
    publicR2Eligible: decision === 'acquire',
    decision,
    verifiedAt: data.verifiedAt,
    verifiedFrom: data.verifiedFrom,
  };
}

/** 記録の正本は台帳 `geo.ksj-official-policy` (data/geo/ksj/official-policy.json)。ここは導出して export するだけ */
export const UNREGISTERED_KSJ_OFFICIAL_POLICY = new Map<string, KsjOfficialPolicy>(
  Object.entries(data.policies as Record<string, Pick<KsjOfficialPolicy, 'license' | 'decision'>>).map(
    ([dataId, p]) => [dataId, makePolicy(p.license, p.decision)] as const
  )
);

export const EXPECTED_UNREGISTERED_POLICY_COUNT = 84;
export const EXPECTED_PUBLIC_ACQUISITION_COUNT = 29;

/**
 * 2026-08-30 時点の公式最新版について、取得選択規則を適用したアーカイブ数。
 * R2 の manifest.json 数と一致したときだけ取得完了と判定する。
 */
export const PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS = new Map<string, number>(
  Object.entries(data.expectedArchiveCounts)
);
