import { describe, expect, it } from 'vitest';

import { findGeoSourcePage, GEO_SOURCE_PAGES } from '../geo-source-pages';

// 台帳 geo.source-pages の並びは公開と監査の順 (export-geo-source-catalog.ts・geo-source-properties.test.ts が頼る)
const EXPECTED_ORDER = [
  'G04-a@11',
  'L01@26',
  'L02@25',
  'L03-a@21',
  'W09@05',
  'A45@19',
  'A54@23',
  'G04-c@11',
  'G04-d@11',
  'G08@15',
  'L03-b@21',
  'L03-b-c@21',
  'L03-b-u@21',
  'A16@20',
  'A17@17',
  'A22@16',
  'A31b@25',
  'A38@20',
  'N03@20250101',
  'A03@03',
  'A09@18',
  'A18@16',
  'A19@17',
  'A23@16',
  'A24@16',
  'A25@16',
  'A30a5@11',
  'A31a@24',
  'A42@18',
  'A43@18',
  'A44@18',
  'A51@24',
  'A52@23',
  'A53@24',
  'A55@24',
  'P04@20',
  'P05@22',
  'P11@22',
  'P29@23',
  'P36@23',
  'C28@07',
  'N02@25',
  'N07@22',
  'S12@25',
  'N08@21',
  'S05-d@18',
  'S10a@16',
  'mesh1000r6@24',
  'm250r6@24',
  'm500r6@24',
];

describe('Geo原典ページの台帳 (geo.source-pages) と読み込み口', () => {
  it('50件を台帳の並びのまま出す', () => {
    expect(GEO_SOURCE_PAGES).toHaveLength(50);
    expect(GEO_SOURCE_PAGES.map((page) => `${page.dataId}@${page.version}`)).toEqual(EXPECTED_ORDER);
  });

  it('dataIdと版が一致するページだけを引く', () => {
    for (const page of GEO_SOURCE_PAGES) {
      expect(findGeoSourcePage(page.dataId, page.version)).toBe(page);
    }
    expect(findGeoSourcePage('L01')).toBeUndefined();
    expect(findGeoSourcePage('L01', '0')).toBeUndefined();
  });

  it('どのページも属性と確認日を持つ', () => {
    for (const page of GEO_SOURCE_PAGES) {
      expect(page.fields.length, page.dataId).toBeGreaterThan(0);
      expect(page.sourceCheckedAt, page.dataId).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
