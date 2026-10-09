import type { RankingItem } from '@stats47/ranking';
import type {
  MapDataPoint,
  MapVisualizationConfig,
} from '@stats47/visualization/d3';

export { getLeafletBorderColor } from './map-palette';

type NullableMapValue = {
  areaCode: string;
  value: number | null;
};

export function rankingItemToMapConfig(
  rankingItem: Pick<RankingItem, 'visualization'>
): MapVisualizationConfig {
  const vis = rankingItem.visualization;

  const baseConfig = {
    classification: vis.classification,
    domain: vis.domain,
    colorScheme: vis.colorScheme,
    isReversed: vis.isReversed,
  };

  if (vis.colorSchemeType === 'diverging') {
    return {
      ...baseConfig,
      colorSchemeType: 'diverging',
      divergingMidpoint: vis.divergingMidpoint,
      divergingMidpointValue: vis.divergingMidpointValue ?? undefined,
      isSymmetrized: vis.isSymmetrized,
    };
  }

  return {
    ...baseConfig,
    colorSchemeType: 'sequential',
  };
}

export function filterMapDataPoints<T extends NullableMapValue>(
  values: T[]
): MapDataPoint[] {
  return values.filter(
    (item): item is T & { value: number } =>
      item.areaCode !== '00000' && item.value !== null
  );
}
