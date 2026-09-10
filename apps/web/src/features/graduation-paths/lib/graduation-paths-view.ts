import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';

import type { GraduationPathsSnapshot } from './graduation-paths-snapshot';

/** Counts and shares always use the same selected school-location population. */
export function selectGraduationPathsView(
  snapshot: GraduationPathsSnapshot,
  areaCode: string | null
) {
  const area =
    areaCode === null || areaCode === '00000'
      ? snapshot.national
      : snapshot.rows.find((row) => row.areaCode === areaCode);
  if (!area) return null;
  return {
    areaCode: area.areaCode,
    areaName: area.areaName,
    total: area.total,
    overlapEmployed: area.overlapEmployed,
    categories: area.categories.map((category, index) => ({
      key: category.key,
      label: GRADUATION_PATHS_SOURCE.categories[index].label,
      count: category.count,
      share: (category.count / area.total) * 100,
    })),
  };
}
