import { lookupArea } from '@stats47/area';
import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';

import type { GraduationPathsSnapshot } from '../lib/graduation-paths-snapshot';

/** Synthetic prefecture allocations for tests; never source observations or publishable data. */
export function graduationPathsFixture(): GraduationPathsSnapshot {
  const rows = Array.from({ length: 47 }, (_, index) => {
    const areaCode = String(index + 1).padStart(2, '0') + '000';
    const values = [
      1000 + index,
      100 + index,
      20 + index,
      2,
      200 + index,
      3,
      7,
      0,
    ];
    return {
      areaCode,
      areaName: lookupArea(areaCode)!.areaName,
      total: 0,
      categories: GRADUATION_PATHS_SOURCE.categories.map(
        (category, categoryIndex) => ({
          key: category.key,
          count: values[categoryIndex],
        })
      ),
      overlapEmployed: index === 12 ? 112 : 0,
      officialEmployed: 200 + index,
    };
  });
  rows[0].categories[7].count = 34;
  rows[12].categories[7].count = 3;
  const subtotal = rows.reduce(
    (total, row) =>
      total +
      row.categories.reduce((count, category) => count + category.count, 0),
    0
  );
  rows[0].categories[0].count += 929157 - subtotal;
  rows[0].officialEmployed +=
    127501 - rows.reduce((total, row) => total + row.officialEmployed, 0);
  rows.forEach((row) => {
    row.total = row.categories.reduce(
      (count, category) => count + category.count,
      0
    );
  });
  return {
    schemaVersion: 1,
    seriesKey: 'graduation-paths',
    period: '2025-03',
    unit: '人',
    releaseStatus: 'final',
    generatedAt: '2026-09-10T00:00:00.000Z',
    source: {
      title: GRADUATION_PATHS_SOURCE.title,
      url: GRADUATION_PATHS_SOURCE.url,
      sha256: GRADUATION_PATHS_SOURCE.sha256,
    },
    rows,
    national: {
      areaCode: '00000',
      areaName: '全国',
      total: rows.reduce((total, row) => total + row.total, 0),
      categories: GRADUATION_PATHS_SOURCE.categories.map((category, index) => ({
        key: category.key,
        count: rows.reduce(
          (count, row) => count + row.categories[index].count,
          0
        ),
      })),
      overlapEmployed: rows.reduce(
        (total, row) => total + row.overlapEmployed,
        0
      ),
      officialEmployed: rows.reduce(
        (total, row) => total + row.officialEmployed,
        0
      ),
    },
  };
}
