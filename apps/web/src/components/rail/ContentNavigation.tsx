import { RailLinksCard } from '@/components/rail';

import type { NavSurface } from '@/lib/analytics/events';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import type { ContentRecommendation } from '@stats47/data-configs/content/navigation';

interface Props {
  title: string;
  items: readonly ContentRecommendation[];
  surface: NavSurface;
  columns?: 1 | 3;
  frame?: 'card' | 'inline';
}

/** 関係の表示を既存のRailLinksCardへ渡す。カードの枠・クリック計測は共通部品が持つ。 */
export function ContentNavigation({
  title,
  items,
  surface,
  columns = 1,
  frame = 'card',
}: Props) {
  if (!items.length) return null;
  return (
    <RailLinksCard
      title={title}
      layout="media"
      columns={columns}
      frame={frame}
      trackingSurface={surface}
      items={items.map((item) => ({
        id: item.id,
        contentId: item.id,
        trackingLabel: item.id,
        href: item.href,
        label: item.title,
        description: item.reason,
        ...(item.kind === 'blog'
          ? {
              thumbnail: {
                lightSrc: blogThumbnailUrl(item.key, 'light'),
                darkSrc: blogThumbnailUrl(item.key, 'dark'),
              },
            }
          : {}),
      }))}
    />
  );
}
