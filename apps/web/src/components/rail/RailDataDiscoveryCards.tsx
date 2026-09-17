import { RailCard } from '@/components/surface';

import type { NavSurface } from '@/lib/analytics/events';

import { RailCategoryList } from './RailCategoryList';
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
  trackingSurface: NavSurface;
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
      {/* カテゴリ導線は home と同じ縦型行 UI (RailCategoryList) を使う。件数は出さない */}
      <RailCard
        title="カテゴリから探す"
        aria-label="カテゴリから探す"
        collapsible={collapsible}
        bodyClassName="px-4 pb-3 pt-0"
      >
        <RailCategoryList
          items={categories}
          showCount={false}
          trackingSurface={trackingSurface}
          moreLink={{
            href: '/ranking',
            label: 'ランキング一覧を見る',
            trackingLabel: 'category:all',
          }}
          className="-mx-4 border-t-0"
        />
      </RailCard>

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
