import "server-only";

import { getMetricConfig } from "@stats47/data-configs";
import {
  deriveFeaturedTop,
  type HomeFeaturedValueRow,
} from "@stats47/ranking";
import { generateRankingThumbnailMapSvg } from "@stats47/visualization/server";

import {
  getFeaturedRankingCardDefinition,
  resolveFeaturedRankingCardModel,
  type FeaturedRankingCardModel,
} from "../utils/resolve-featured-ranking-card";

interface BuildFeaturedRankingCardModelInput {
  rankingKey: string;
  title: string;
  values: readonly HomeFeaturedValueRow[];
}

/**
 * category / survey の生データを共通カードmodelへ変換する唯一のserver経路。
 * 1回のvalues readから派生値と地図を作り、表示面ごとの加工差を防ぐ。
 */
export function buildFeaturedRankingCardModel({
  rankingKey,
  title,
  values,
}: BuildFeaturedRankingCardModelInput): FeaturedRankingCardModel | null {
  if (values.length === 0) return null;

  const metricConfig = getMetricConfig(rankingKey);
  const tileMapSvg = generateRankingThumbnailMapSvg(
    values.flatMap((value) =>
      value.value !== null
        ? [
            {
              areaCode: value.areaCode,
              value: value.value,
              rank: value.rank ?? undefined,
            },
          ]
        : []
    ),
    {
      colorScheme: metricConfig?.visualization?.colorScheme,
      isReversed: metricConfig?.visualization?.isReversed,
      idSuffix: rankingKey,
    }
  );

  return resolveFeaturedRankingCardModel(
    {
      definition: getFeaturedRankingCardDefinition(rankingKey),
      featuredTop: deriveFeaturedTop(values),
      tileMapSvg,
    },
    title
  );
}
