import { describe, it, expect } from 'vitest';

import {
  parseGeoSourceCatalog,
  parseGeoSourceItem,
} from '../geo-source-catalog';
const item = {
  dataId: 'P29',
  version: '23',
  sourceUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29.html',
  assets: [
    { key: 'gis/mlit-ksj/P29/23/13.topojson', label: '東京都', bytes: 10 },
  ],
};
describe('public GIS file inventory boundary', () => {
  it('accepts a finite dataset-scoped file list', () => {
    expect(parseGeoSourceItem(item)).toEqual(item);
  });
  it('rejects traversal, other datasets, other versions and duplicate files', () => {
    for (const key of [
      'gis/mlit-ksj/P29/23/../13.topojson',
      'gis/mlit-ksj/P29/22/13.topojson',
      'gis/mlit-ksj/C23/23/13.topojson',
      'https://example.com/data.topojson',
    ])
      expect(
        parseGeoSourceItem({ ...item, assets: [{ ...item.assets[0], key }] })
      ).toBeNull();
    expect(
      parseGeoSourceItem({ ...item, assets: [...item.assets, ...item.assets] })
    ).toBeNull();
  });
  it('keeps the hub index small and rejects empty/duplicate summaries', () => {
    const summary = {
      dataId: item.dataId,
      version: item.version,
      sourceUrl: item.sourceUrl,
      assetCount: 1,
    };
    expect(
      parseGeoSourceCatalog({
        schemaVersion: 1,
        generatedAt: '2026-09-08',
        items: [summary],
      })
    ).not.toBeNull();
    expect(
      parseGeoSourceCatalog({
        schemaVersion: 1,
        generatedAt: '2026-09-08',
        items: [summary, summary],
      })
    ).toBeNull();
    expect(parseGeoSourceItem({ ...item, assets: [] })).toBeNull();
  });
});
