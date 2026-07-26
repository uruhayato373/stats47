import {
  generateMiniPrefectureSvg,
} from "./generate-mini-prefecture-svg";

interface RankingThumbnailMapOptions {
  colorScheme?: string;
  isReversed?: boolean;
  idSuffix?: string;
}

export function generateRankingThumbnailMapSvg(
  rows: Array<{ areaCode: string; value: number; rank?: number }>,
  options: RankingThumbnailMapOptions = {},
): string {
  return generateMiniPrefectureSvg(
    rows,
    options.colorScheme,
    options.isReversed,
    options.idSuffix,
  );
}
