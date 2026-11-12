import type { ReactNode } from 'react';

import { Newspaper } from 'lucide-react';

import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { readContentRecommendations } from '@/features/content-navigation/server';

import type { AreaHighlights } from '@stats47/area-profile';

interface AreaRelatedBlogArticlesProps {
  highlights: AreaHighlights;
  areaCode?: string;
  limit?: number;
  /** 一覧の 3 件目の後に入れる広告 (県のページのインフィード広告。置き場は台帳の area) */
  inFeedAd?: ReactNode;
}

/**
 * 広告は一覧が 1 列のときだけ出す。一覧は 1 列 20rem 以上を保てる数だけ列を並べ (RailLinksCard)、カードの内側の余白が 2rem なので、
 * カードの幅が 43.5rem (20rem × 2 + 列の間 1.5rem + 余白 2rem) 以上で 2 列になる。2 列以上では一覧がページの上の方にあり
 * (1440px で 702px・768px で 753px)、広告が最初の画面に入り (台帳の noFirstView)、同じ行の記事も広告の高さまで伸びた
 * (2026-11-12 手元で測定)。列の数は画面の幅ではなくカードの幅で決まるので、コンテナクエリで出し分ける
 */
const IN_FEED_AD_ONE_COLUMN_ONLY_CLASS = '@min-[43.5rem]:hidden';
/** 広告の前に置く記事の数 (Google の推奨: 広告と広告の間にコンテンツを 3 件以上。support.google.com/adsense/answer/9189037) */
const IN_FEED_AD_AFTER = 3;

/**
 * 県の特徴 (上位・下位のランキング) を読み解くブログ記事。県ページ本文の見出し付きカード 1 枚で、
 * 行はサムネイル (16:9・幅 96px) + 題名 + 矢印のリンク行 (RailLinksCard の media 行) を区切り線で並べる。
 * 列数はカードの幅で決める (1 列 20rem 以上を保てる数だけ)。
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
  // 関係の補助ラベル (「同じデータを読み解く記事」) は見出しと同じことを繰り返すだけなので渡さない
  const withoutReason = items.map((item) => ({ ...item, reason: '' }));
  if (!items.length) return null;
  return (
    <div className="@container">
    <ContentNavigation
      title="この県の特徴を読み解く記事"
      icon={<Newspaper />}
      items={withoutReason}
      surface="area_blog"
      columns={3}
      insertAfter={inFeedAd ? { index: IN_FEED_AD_AFTER, node: inFeedAd, className: IN_FEED_AD_ONE_COLUMN_ONLY_CLASS } : undefined}
    />
    </div>
  );
}
