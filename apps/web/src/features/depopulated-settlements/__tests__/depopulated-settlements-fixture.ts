import { DEPOPULATED_SETTLEMENTS_SOURCE as source } from '@stats47/data-configs/theme-catalog';

import type { DepopulatedSettlementsSnapshot } from '../lib/depopulated-settlements-snapshot';

/** Synthetic block allocations conserve the published national margins; no R2/network dependency. */
export function depopulatedSettlementsFixture(): DepopulatedSettlementsSnapshot {
  const nationalCounts = source.categories.map(
    (category) => source.nationalPins[category.key]
  );
  const row = (
    blockCode: string,
    blockName: string,
    counts: number[],
    allOlder: number
  ) => ({
    blockCode,
    blockName,
    categories: source.categories.map((category, i) => ({
      key: category.key,
      count: counts[i],
    })),
    total: counts.reduce((a, b) => a + b, 0),
    age65ShareUnder50: counts.slice(0, 4).reduce((a, b) => a + b, 0),
    age65Share50plus: counts[4] + counts[5],
    age65Share100: allOlder,
  });
  return {
    schemaVersion: 1,
    seriesKey: 'depopulated-settlements',
    period: source.period,
    unit: source.unit,
    geography: source.geography,
    universeId: source.universeId,
    generatedAt: '2026-09-10T00:00:00.000Z',
    source: {
      title: source.title,
      url: source.url,
      sha256: source.sha256,
      pdfPage: source.pdfPage,
      mappingPdfPage: source.mappingPdfPage,
    },
    rows: source.blocks.map((block, index) =>
      row(
        block.blockCode,
        block.blockName,
        nationalCounts.map((count) =>
          index < 9
            ? Math.floor(count / 10)
            : count - Math.floor(count / 10) * 9
        ),
        index < 9 ? 145 : 153
      )
    ),
    national: row('00', '全国', nationalCounts, 1458),
  };
}
