import { lookupArea } from '@stats47/area';
import { CULTURAL_HERITAGE_SOURCE as definition } from '@stats47/data-configs/theme-catalog';

import type {
  CulturalHeritageKind,
  CulturalHeritageSnapshot,
} from './cultural-heritage-snapshot';

export function selectCulturalHeritageView(
  snapshot: CulturalHeritageSnapshot,
  areaCode: string | null,
  kind: CulturalHeritageKind | 'all' = 'all'
) {
  const national = areaCode === null || areaCode === '00000';
  if (
    !national &&
    (!/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(areaCode) || !lookupArea(areaCode))
  )
    return null;
  const areaRows = national
    ? snapshot.records
    : snapshot.records.filter((row) => row.prefectureCodes.includes(areaCode));
  return {
    areaName: national ? '全国' : lookupArea(areaCode)!.areaName,
    areaCode: national ? '00000' : areaCode,
    total: areaRows.length,
    records:
      kind === 'all'
        ? areaRows
        : areaRows.filter((row) => row.kinds.includes(kind)),
    categories: definition.categories.map((category) => ({
      key: category.key,
      label: category.label,
      count: areaRows.filter((row) => row.kinds.includes(category.key)).length,
    })),
    unspecifiedCount: snapshot.records.filter(
      (row) => row.geography === 'unspecified'
    ).length,
    tourismHref: national
      ? '/themes/tourism?pref=all'
      : `/themes/tourism?pref=${areaCode}`,
  };
}
