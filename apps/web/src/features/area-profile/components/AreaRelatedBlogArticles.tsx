import type { ReactNode } from 'react';

import { RelatedArticles } from '@/features/content-navigation/RelatedArticles';
import { readContentRecommendations } from '@/features/content-navigation/server';

import type { AreaHighlights } from '@stats47/area-profile';

interface AreaRelatedBlogArticlesProps {
  highlights: AreaHighlights;
  areaCode?: string;
  limit?: number;
  /** 一覧の 3 件目の後に入れる広告 (県のページのインフィード広告。置き場は台帳の area) */
  inFeedAd?: ReactNode;
}

/** 広告の前に置く記事の数 (Google の推奨: 広告と広告の間にコンテンツを 3 件以上。support.google.com/adsense/answer/9189037) */
const IN_FEED_AD_AFTER = 3;

/**
 * 県の上位・下位の指標から選んだ記事を共通の関連記事欄へ渡す。inFeedAd は、記事の格子が 1 列のとき (スマホ) だけ 3 件目の後に出す。
 * 2 列以上では一覧がページの上の方にあり、広告が最初の画面に入るので出さない (2026-11-12。台帳の noFirstView)
 */
export async function AreaRelatedBlogArticles({
  highlights,
  areaCode,
  limit = 3,
  inFeedAd,
}: AreaRelatedBlogArticlesProps) {
  const rankingKeys = [...highlights.top, ...highlights.bottom].map(
    (row) => row.rankingKey
  );
  const items = await readContentRecommendations({
    sourceId: `area:${areaCode ?? ''}`,
    kinds: ['blog'],
    rankingKeys,
    limit,
  });
  return (
    <RelatedArticles
      items={items}
      surface="area_blog"
      insertAfter={inFeedAd ? { index: IN_FEED_AD_AFTER, node: inFeedAd } : undefined}
    />
  );
}
