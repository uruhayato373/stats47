import type { StrengthWeaknessItem } from '../types';

/** 同じ表示名の派生指標をまとめ、県の特徴として異なる論点を優先する。 */
export function selectDistinctProfileItems(
  items: StrengthWeaknessItem[],
  limit: number
): StrengthWeaknessItem[] {
  const seen = new Set<string>();
  const selected: StrengthWeaknessItem[] = [];

  for (const item of items) {
    const label = item.indicator.trim();
    if (seen.has(label)) continue;
    seen.add(label);
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}
