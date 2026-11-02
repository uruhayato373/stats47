import "server-only";

import { getMetricConfig } from "@stats47/data-configs";
import { resolveRankingHook } from "@stats47/data-configs/prominence";
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
  /** 表示面の編集で書いた問い (調査ハブの「読者の問い」)。あれば導出した問いより優先する */
  hook?: string;
}

/**
 * category / survey の生データを共通カードmodelへ変換する唯一のserver経路。
 * 1回のvalues readから派生値と地図を作り、表示面ごとの加工差を防ぐ。
 */
export function buildFeaturedRankingCardModel({
  rankingKey,
  title,
  values,
  hook,
}: BuildFeaturedRankingCardModelInput): FeaturedRankingCardModel | null {
  if (values.length === 0) return null;

  const metricConfig = getMetricConfig(rankingKey);
  // サイト共通の代表でない指標も、同じ規則 (個別の上書き → 導出) で問いかけにする。
  // 指標名をそのまま題名にすると「緑茶消費量（都道府県庁所在市の…）」のように並びがそろわなかった (2026-11-02)
  const representativeHook =
    REPRESENTATIVE_HOOK_BY_KEY.get(rankingKey) ??
    (metricConfig
      ? resolveRankingHook({ rankingKey, title: metricConfig.title, unit: metricConfig.unit })
      : undefined);
  const representativeDefinition = representativeHook ? { hook: representativeHook } : null;

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
      // 都市別の調査では、導出した「〜が最も多い県は？」が対象 (県庁所在市) とずれる。編集した問いを先に使う (2026-11-02)
      definition: hook
        ? { hook }
        : (getFeaturedRankingCardDefinition(rankingKey) ?? representativeDefinition),
      featuredTop: deriveFeaturedTop(values),
      tileMapSvg,
    },
    title
  );
}
