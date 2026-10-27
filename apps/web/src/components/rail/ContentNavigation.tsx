import type { ReactNode } from 'react';

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
  /** 見出しの左のアイコン。省略時は RailLinksCard の既定。 */
  icon?: ReactNode;
}

/**
 * 関係の表示を既存のRailLinksCardへ渡す。カードの枠・クリック計測は共通部品が持つ。
 * 全項目が同じ関係 (reason) なら、各行の補助ラベルは見出しの繰り返しにしかならないので出さない
 * (例: 見出し「このランキングを読み解く」の各行に「このデータを読み解く記事」が並んでいた)。
 *
 * 画像 (ブログのサムネイル) も補助ラベルも無い 1 列の一覧は、画像付きの行 (media・44px) ではなく
 * RailLinksCard の通常のリンク行 (list・sm 以上 36px) で描く (2026-10-28 3 巡目。文字だけの行が
 * 画像付きの行の高さで間延びしていた)。
 */
export function ContentNavigation({
  title,
  items,
  surface,
  columns = 1,
  frame = 'card',
  icon,
}: Props) {
  if (!items.length) return null;
  const showReason = new Set(items.map((item) => item.reason)).size > 1;
  const hasThumbnail = items.some((item) => item.kind === 'blog');
  const layout =
    hasThumbnail || showReason || columns !== 1 || frame !== 'card' ? 'media' : 'list';
  return (
    <RailLinksCard
      title={title}
      icon={icon}
      layout={layout}
      columns={columns}
      frame={frame}
      trackingSurface={surface}
      items={items.map((item) => ({
        id: item.id,
        contentId: item.id,
        trackingLabel: item.id,
        href: item.href,
        label: item.title,
        description: showReason ? item.reason : undefined,
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
