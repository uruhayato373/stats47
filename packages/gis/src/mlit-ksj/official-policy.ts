import type { KsjLicense } from './types';

export type KsjOfficialPolicy = {
  license: KsjLicense;
  publicR2Eligible: boolean;
  decision: 'acquire' | 'license-review' | 'local-only';
  verifiedAt: '2026-08-30';
  verifiedFrom: 'https://nlftp.mlit.go.jp/ksj/gml/gml_datalist.html';
};

const PUBLIC_CC_BY = [
  'A03', 'A09', 'A18', 'A19', 'A23', 'A24', 'A25', 'A30a5', 'A31a',
  'A42', 'A43', 'A44', 'A45', 'A51', 'A52', 'A53', 'A54',
] as const;

const PUBLIC_COMMERCIAL_OK = [
  'A55', 'G04-c', 'G04-d', 'G08', 'L03-b', 'L03-b-c', 'L03-b-u', 'N08',
  'S05-d', 'S10a', 'm250r6', 'm500r6',
] as const;

const PARTIAL_LICENSE_REVIEW = ['A11', 'A46', 'A47', 'A48', 'A49', 'A50'] as const;

const NON_COMMERCIAL = [
  'A15', 'A18s-a', 'A19s', 'A20', 'A20s', 'A21', 'A21s', 'A22-m', 'A22s',
  'A28', 'A30b', 'A34', 'A35a', 'A35b', 'A35c', 'A37', 'A39', 'G02', 'L05',
  'N04', 'N05', 'N09', 'N10', 'N11', 'N12', 'P02', 'P07', 'P09', 'P15', 'P16',
  'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P26', 'P27', 'P28', 'P30', 'P31',
  'P32', 'P33', 'P34', 'S05-a', 'S05-b', 'S05-c', 'S10b', 'W07',
] as const;

const VERIFIED_FROM = 'https://nlftp.mlit.go.jp/ksj/gml/gml_datalist.html' as const;
const VERIFIED_AT = '2026-08-30' as const;

function makePolicy(
  license: KsjLicense,
  decision: KsjOfficialPolicy['decision']
): KsjOfficialPolicy {
  return {
    license,
    publicR2Eligible: decision === 'acquire',
    decision,
    verifiedAt: VERIFIED_AT,
    verifiedFrom: VERIFIED_FROM,
  };
}

export const UNREGISTERED_KSJ_OFFICIAL_POLICY = new Map<string, KsjOfficialPolicy>([
  ...PUBLIC_CC_BY.map((dataId) => [dataId, makePolicy('cc-by-4.0', 'acquire')] as const),
  ...PUBLIC_COMMERCIAL_OK.map((dataId) => [dataId, makePolicy('commercial-ok', 'acquire')] as const),
  ...PARTIAL_LICENSE_REVIEW.map((dataId) => [
    dataId,
    makePolicy('cc-by-4.0-partial', 'license-review'),
  ] as const),
  ...NON_COMMERCIAL.map((dataId) => [
    dataId,
    makePolicy('non-commercial', 'local-only'),
  ] as const),
]);

export const EXPECTED_UNREGISTERED_POLICY_COUNT = 84;
export const EXPECTED_PUBLIC_ACQUISITION_COUNT = 29;

/**
 * 2026-08-30 時点の公式最新版について、取得選択規則を適用したアーカイブ数。
 * R2 の manifest.json 数と一致したときだけ取得完了と判定する。
 */
export const PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS = new Map<string, number>([
  ['A03', 3], ['A09', 46], ['A18', 22], ['A19', 25], ['A23', 14],
  ['A24', 44], ['A25', 47], ['A30a5', 106], ['A31a', 91], ['A42', 1],
  ['A43', 1], ['A44', 1], ['A45', 47], ['A51', 9], ['A52', 24],
  ['A53', 7], ['A54', 1], ['A55', 47], ['G04-c', 176], ['G04-d', 169],
  ['G08', 47], ['L03-b', 176], ['L03-b-c', 14], ['L03-b-u', 123],
  ['N08', 1], ['S05-d', 1], ['S10a', 1], ['m250r6', 47], ['m500r6', 47],
]);
