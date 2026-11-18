import { lookupArea, PREFECTURE_AREA_CODE_RE } from '@stats47/area';
import { NATIONAL_AREA_CODE, isNationalAreaCode } from '@stats47/area/area-code';
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
  const national = areaCode === null || isNationalAreaCode(areaCode);
  if (
    !national &&
    (!PREFECTURE_AREA_CODE_RE.test(areaCode) || !lookupArea(areaCode))
  )
    return null;
  const areaRows = national
    ? snapshot.records
    : snapshot.records.filter((row) => row.prefectureCodes.includes(areaCode));
  return {
    areaName: national ? '全国' : lookupArea(areaCode)!.areaName,
    areaCode: national ? NATIONAL_AREA_CODE : areaCode,
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
