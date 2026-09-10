import { lookupArea } from '@stats47/area';
import { DEPOPULATED_SETTLEMENTS_SOURCE } from '@stats47/data-configs/theme-catalog';

import type { DepopulatedSettlementsSnapshot } from './depopulated-settlements-snapshot';

/** Selection changes the displayed survey block; never create prefecture observations. */
export function selectDepopulatedSettlementsView(
  snapshot: DepopulatedSettlementsSnapshot,
  prefectureCode: string | null
) {
  const national = prefectureCode === null || prefectureCode === '00000';
  const block = national
    ? undefined
    : DEPOPULATED_SETTLEMENTS_SOURCE.blocks.find((block) =>
        (block.prefectureCodes as readonly string[]).includes(prefectureCode)
      );
  if (!national && !block) return null;
  const selected = national
    ? snapshot.national
    : snapshot.rows.find((row) => row.blockCode === block?.blockCode);
  if (!selected) return null;
  return {
    ...selected,
    geography: national ? ('national' as const) : ('survey-block' as const),
    requestedPrefectureName: national
      ? null
      : (lookupArea(prefectureCode)?.areaName ?? null),
    memberPrefectureNames:
      block?.prefectureCodes
        .map((code) => lookupArea(code)?.areaName)
        .filter((name): name is string => Boolean(name)) ?? [],
    categories: selected.categories.map((category, i) => ({
      ...category,
      label: DEPOPULATED_SETTLEMENTS_SOURCE.categories[i].label,
      share: (category.count / selected.total) * 100,
    })),
    age65Share50plusPercent: (selected.age65Share50plus / selected.total) * 100,
  };
}
