import { assertKnownColorScheme } from '@stats47/types';

/** Image colors must match the published item, where polarity is already resolved. */
export function resolveRankingImageVisualization(
  visualization: { colorScheme?: string; isReversed?: boolean } | null | undefined,
  rankingKey: string
) {
  if (!visualization?.colorScheme) {
    throw new Error(`${rankingKey}: ranking itemに配色がありません`);
  }
  return {
    colorScheme: assertKnownColorScheme(
      visualization.colorScheme,
      `ranking-image(${rankingKey})`
    ),
    isReversed: visualization.isReversed,
  };
}
