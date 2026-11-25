import {
  normalizationOptionId,
  presentationForNormalizedValues,
  type SeriesNormalizationOption,
} from '@stats47/types';

import type { RankingItem } from '@stats47/ranking';

/** 計算方法の選択肢を識別子 (URL の ?norm=。series は指標のキー) で引く */
export function findNormalizationOption(item: RankingItem, value: string | null | undefined) {
  if (!value) return undefined;
  return item.calculation?.normalizationOptions?.find(option => normalizationOptionId(option) === value);
}

/** 選択肢が「別の指標の公表値を出す見方」なら返す (値はその指標の values を読む) */
export function findSeriesOption(item: RankingItem, value: string | null | undefined): SeriesNormalizationOption | undefined {
  const option = findNormalizationOption(item, value);
  return option?.type === 'series' ? option : undefined;
}

/** All views share the currently selected basis, unit, precision and color policy. */
export function resolveRankingPresentation(item: RankingItem, normalizationType: string | null | undefined): RankingItem {
  if (!normalizationType) return item;
  const option = findNormalizationOption(item, normalizationType);
  if (!option) throw new Error('Unknown ranking normalization: ' + normalizationType);
  if (option.type === 'series') {
    // 別の指標の公表値: 単位・桁・色はその指標の定義から配信の組み立てが焼いたもの
    return {
      ...item, title: `${item.title}（${option.label}）`, unit: option.unit, normalizationBasis: option.label,
      valueDisplay: option.valueDisplay ?? { conversionFactor: 1, decimalPlaces: 1, displayUnit: option.unit },
      visualization: option.visualization ?? presentationForNormalizedValues(item.visualization),
    };
  }
  return {
    ...item, title: `${item.title}（${option.label}）`, unit: option.unit, normalizationBasis: option.label,
    valueDisplay: { conversionFactor: 1, decimalPlaces: option.decimalPlaces ?? 1, displayUnit: option.unit },
    visualization: option.visualization ?? presentationForNormalizedValues(item.visualization),
  };
}

export function supportedRankingNormalization(item: RankingItem, value?: string): string | undefined {
  return findNormalizationOption(item, value) ? value : undefined;
}
