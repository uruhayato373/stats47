import { GEO_SOURCE_PAGES } from '@stats47/data-configs/business-plan';
import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { describe, expect, it } from 'vitest';

import {
  formatGeoSourceProperty,
  visibleGeoSourceFields,
} from '../geo-source-properties';

describe('GIS reading guides and property units', () => {
  it('never presents unpublished or other-route station counts as zero passengers', () => {
    const field = GEO_SOURCE_PAGES.find((p) => p.dataId === 'S12')!.fields.find(
      (candidate) => candidate.key === 'S12_061'
    )!;
    expect(
      formatGeoSourceProperty(field, { S12_061: 0, S12_059: 3, S12_058: 1 })
    ).toContain('非公開');
    expect(
      formatGeoSourceProperty(field, { S12_061: 0, S12_059: 1, S12_058: 2 })
    ).toContain('この路線駅に記載なし');
    expect(
      formatGeoSourceProperty(field, { S12_061: 0, S12_059: 1, S12_058: 1 })
    ).toBe('0 人/日');
    expect(
      formatGeoSourceProperty(field, {
        S12_061: 726,
        S12_059: '1',
        S12_058: '1',
      })
    ).toBe('726 人/日');
    expect(formatGeoSourceProperty(field, { S12_061: 0 })).not.toContain(
      '0 人'
    );
  });
  it('shows the schema of the selected medical area without inventing absent fields', () => {
    const fields = GEO_SOURCE_PAGES.find((p) => p.dataId === 'A38')!.fields;
    const properties = { A38c_001: '北海道', A38c_002: null };
    expect(
      visibleGeoSourceFields(fields, properties).map((f) => f.key)
    ).toEqual(['A38c_001', 'A38c_002']);
    expect(
      formatGeoSourceProperty(
        fields.find((f) => f.key === 'A38c_002')!,
        properties
      )
    ).toBe('データなし');
    expect(visibleGeoSourceFields(fields, {})).toEqual([]);
  });
  it('distinguishes the same flood-depth code in three- and six-band classifications', () => {
    const fields = GEO_SOURCE_PAGES.find((p) => p.dataId === 'A53')!.fields;
    const three = fields.find((f) => f.key === 'A53_003')!;
    const six = fields.find((f) => f.key === 'A53_004')!;
    expect(formatGeoSourceProperty(three, { A53_003: 3 })).toBe(
      '3.0m以上（3）'
    );
    expect(formatGeoSourceProperty(six, { A53_004: 3 })).toBe(
      '3.0〜5.0m未満（3）'
    );
  });
  it('only links eligible datasets and matches the version being explained', () => {
    expect(new Set(GEO_SOURCE_PAGES.map((p) => p.dataId)).size).toBe(
      GEO_SOURCE_PAGES.length
    );
    for (const page of GEO_SOURCE_PAGES) {
      expect(page.version).toBe(
        GIS_DATASETS_BY_ID.get(page.dataId)?.latestVersion
      );
      for (const id of [page.dataId, ...page.relatedIds])
        expect(
          getKsjLicensePolicy(GIS_DATASETS_BY_ID.get(id)!.license)
            .sourcePublication
        ).toBe('public-r2-eligible');
      expect(new Set(page.fields.map((f) => f.key)).size).toBe(
        page.fields.length
      );
    }
  });
  it('preserves the different denominators of forest and other assessed land prices', () => {
    const field = GEO_SOURCE_PAGES.find((p) => p.dataId === 'L02')!.fields.find(
      (f) => f.key === 'L02_006'
    )!;
    expect(
      formatGeoSourceProperty(field, { L02_001: '020', L02_006: 12000 })
    ).toBe('12,000 円/10a');
    expect(
      formatGeoSourceProperty(field, { L02_001: '000', L02_006: 12000 })
    ).toBe('12,000 円/m²');
  });
  it('does not convert absent measurements to zero', () => {
    const field = GEO_SOURCE_PAGES[0].fields[1];
    for (const value of [null, undefined, '', 'unknown'])
      expect(formatGeoSourceProperty(field, { [field.key]: value })).toBe(
        'データなし'
      );
    expect(formatGeoSourceProperty(field, { [field.key]: '0.0' })).toBe('0 m');
  });
  it('keeps unknown codes visible and does not reuse rural codes for urban land use', () => {
    const field = GEO_SOURCE_PAGES.find(
      (p) => p.dataId === 'L03-b'
    )!.fields.find((f) => f.key === '土地利用種別')!;
    expect(formatGeoSourceProperty(field, { 土地利用種別: '0500' })).toBe(
      '森林（0500）'
    );
    expect(formatGeoSourceProperty(field, { 土地利用種別: '9999' })).toBe(
      '9999'
    );
    const urban = GEO_SOURCE_PAGES.find(
      (p) => p.dataId === 'L03-b-u'
    )!.fields.find((f) => f.key === '土地利用種別')!;
    expect(urban.values).toBeUndefined();
  });
});
