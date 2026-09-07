import type { NavSurface } from '@/lib/analytics/events';

import { RailLinksCard } from './RailLinksCard';
import { RailPrefectureCard, type RailPrefecture } from './RailPrefectureCard';


export interface RailDiscoveryCategory {
  categoryKey: string;
  categoryName: string;
}

export interface RailDiscoveryTheme {
  themeKey: string;
  title: string;
}

interface RailDataDiscoveryCardsProps {
  categories: readonly RailDiscoveryCategory[];
  themes: readonly RailDiscoveryTheme[];
  prefectures: readonly RailPrefecture[];
  trackingSurface?: NavSurface;
  collapsible?: boolean;
}

/** カテゴリ・テーマ・都道府県を独立カードで並べる共通データ探索導線。 */
export function RailDataDiscoveryCards({
  categories,
  themes,
  prefectures,
  trackingSurface,
  collapsible = false,
}: RailDataDiscoveryCardsProps) {
  return (
    <>
      <RailLinksCard
        title="カテゴリから探す"
        items={categories.map((category) => ({
          id: category.categoryKey,
          label: category.categoryName,
          href: `/category/${category.categoryKey}`,
          trackingLabel: `category:${category.categoryKey}`,
        }))}
        layout="grid"
        moreLink={{
          href: '/ranking',
          label: 'ランキング一覧を見る →',
          trackingLabel: 'category:all',
        }}
        trackingSurface={trackingSurface}
        collapsible={collapsible}
      />

      <RailLinksCard
        title="テーマから探す"
        items={themes.map((theme) => ({
          id: theme.themeKey,
          label: theme.title,
          href: `/themes/${theme.themeKey}`,
          trackingLabel: `theme:${theme.themeKey}`,
        }))}
        layout="list"
        moreLink={{
          href: '/themes',
          label: 'すべてのテーマを見る →',
          trackingLabel: 'theme:all',
        }}
        trackingSurface={trackingSurface}
        collapsible={collapsible}
      />

      <RailPrefectureCard
        title="都道府県から探す"
        prefectures={prefectures}
        trackingSurface={trackingSurface}
        collapsible={collapsible}
      />
    </>
  );
}
