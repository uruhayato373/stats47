import { presentationForNormalizedValues } from '@stats47/types';

import type { RankingItem } from '@stats47/ranking';

/** All views share the currently selected basis, unit, precision and color policy. */
export function resolveRankingPresentation(item: RankingItem, normalizationType: string | null | undefined): RankingItem {
  if (!normalizationType) return item;
  const option = item.calculation?.normalizationOptions?.find(option => option.type === normalizationType);
  if (!option) throw new Error('Unknown ranking normalization: ' + normalizationType);
  return {
    ...item, title: `${item.title}（${option.label}）`, unit: option.unit, normalizationBasis: option.label,
    valueDisplay: { conversionFactor: 1, decimalPlaces: option.decimalPlaces ?? 1, displayUnit: option.unit },
    visualization: option.visualization ?? presentationForNormalizedValues(item.visualization),
  };
}

export function supportedRankingNormalization(item: RankingItem, value?: string): string | undefined {
 return (value === 'per_population' || value === 'per_area') && item.calculation?.normalizationOptions?.some(option => option.type === value) ? value : undefined;
}
