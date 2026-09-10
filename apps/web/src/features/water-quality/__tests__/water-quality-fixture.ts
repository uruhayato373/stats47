import { lookupArea } from '@stats47/area';
import { WATER_QUALITY_SOURCE as s } from '@stats47/data-configs/theme-catalog';

const prefs = Array.from({ length: 47 }, (_, i) => {
  const prefCode = `${String(i + 1).padStart(2, '0')}000`;
  return { prefCode, prefName: lookupArea(prefCode)!.areaName };
});
import type { WaterQualitySnapshot } from '../lib/water-quality-snapshot';
export function waterQualityFixture(): WaterQualitySnapshot {
  const rows: WaterQualitySnapshot['rows'] = [];
  for (const kind of ['river', 'lake', 'sea'] as const) {
    for (let i = 0; i < s.rowCounts[kind]; i++) {
      const perPage = kind === 'river' ? 80 : kind === 'lake' ? 66 : 70,
        start = kind === 'river' ? 2 : kind === 'lake' ? 35 : 38;
      const page = start + Math.floor(i / perPage),
        row = (i % perPage) + 1,
        area = prefs[i % prefs.length]!;
      rows.push({
        id: `${kind}-p${String(page).padStart(3, '0')}-r${String(row).padStart(3, '0')}`,
        kind,
        page,
        row,
        listingAreaCode: area.prefCode,
        relatedAreaCodes: [area.prefCode],
        name: `試験水域${i}`,
        kana: `テスト${i}`,
        class: 'A',
        limit: kind === 'lake' ? 3 : 2,
        value75: '<0.5',
        mean: '0.6',
        compliant: true,
      });
    }
  }
  const anomaly = rows.find((r) => r.id === s.anomaly.id)!;
  Object.assign(anomaly, {
    listingAreaCode: s.anomaly.prefecture,
    relatedAreaCodes: [s.anomaly.prefecture],
    name: s.anomaly.name,
    class: 'C',
    limit: 8,
    value75: '3.7',
    mean: '3.0',
  });
  return {
    schemaVersion: 1,
    generatedAt: '2026-09-11T00:00:00.000Z',
    period: s.period,
    source: {
      title: s.title,
      url: s.url,
      sha256: s.sha256,
      mainUrl: s.mainUrl,
      mainSha256: s.mainSha256,
    },
    national: structuredClone(s.national),
    prefectures: prefs.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
    })),
    rows,
    notes: [...s.notes],
  };
}
