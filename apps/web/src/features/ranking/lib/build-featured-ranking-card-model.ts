import "server-only";

import { getMetricConfig } from "@stats47/data-configs";
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";
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

/**
 * カテゴリの代表ランキングの問いかけ (hook)。home の注目と同じ生成物 (ranking-prominence) から引き、
 * category / survey の注目カードの題名を home と同じ「〜が最も多い県は？」の書式に揃える。
 * (旧実装は home の注目 8 件以外で指標名をそのまま題名にしていた)
 */
const REPRESENTATIVE_HOOK_BY_KEY = new Map(
  RANKING_PROMINENCE_CATEGORIES.flatMap((category) =>
    category.representatives.map((representative) => [
      representative.rankingKey,
      representative.hook,
    ] as const),
  ),
);

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

  const representativeHook = REPRESENTATIVE_HOOK_BY_KEY.get(rankingKey);
  const representativeDefinition = representativeHook ? { hook: representativeHook } : null;

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
      definition: getFeaturedRankingCardDefinition(rankingKey) ?? representativeDefinition,
      featuredTop: deriveFeaturedTop(values),
      tileMapSvg,
    },
    title
  );
}
