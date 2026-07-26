import type { ImageGenerationManifest } from '@stats47/types';

export const RANKING_THUMBNAIL_VERSION = 4;
export const RANKING_THUMBNAIL_SIZE = { width: 640, height: 360 } as const;

export function rankingThumbnailKeys(rankingKey: string) {
  const base = `app/ranking/${rankingKey}`;
  return {
    light: `${base}/thumbnail-light.webp`,
    dark: `${base}/thumbnail-dark.webp`,
    manifest: `${base}/thumbnail.json`,
  } as const;
}

export interface RankingThumbnailMetadata {
  version: typeof RANKING_THUMBNAIL_VERSION;
  rankingKey: string;
  geographicLayout: {
    mainlandClockwiseRotationDegrees: number;
    okinawa: 'excluded' | 'inset';
  };
  year: string;
  generatedAt: string;
  source: {
    item: `app/ranking/${string}/item.json`;
    values: `app/ranking/${string}/values.json`;
    config: `packages/data-configs/src/metrics/${string}.ts`;
    topology: 'packages/gis/data/geoshape/prefecture.topojson';
  };
  assets: {
    light: string;
    dark: string;
    width: typeof RANKING_THUMBNAIL_SIZE.width;
    height: typeof RANKING_THUMBNAIL_SIZE.height;
    format: 'webp';
  };
}

export type RankingThumbnailManifest =
  ImageGenerationManifest<RankingThumbnailMetadata> & {
    generator: 'ranking-card';
  };
