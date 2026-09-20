'use client';

import Link from 'next/link';

import { cn } from '@stats47/components';
import { ChevronRight } from 'lucide-react';

import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';
import { RailCard, RailNavRow } from '@/components/surface';

import { trackNavClick, type NavSurface } from '@/lib/analytics/events';

export interface RailLinksCardItem {
  id: string;
  label: string;
  href: string;
  /** 現在表示中のページ。list 行では aria-current と active 表示を付ける。 */
  active?: boolean;
  count?: number;
  ariaLabel?: string;
  trackingLabel?: string;
  thumbnail?: {
    lightSrc: string;
    darkSrc: string;
    alt?: string;
  };
}

/**
 * - `chips`: タグ専用のピル (rounded-full)。カテゴリ導線には使わない (RailCategoryList を使う)
 * - `list`: 透明背景のリンク行 (RailNavRow)。テーマ・目次・関連リンクなど
 * - `media` / `ranked`: サムネイル付き・順位付きの記事行
 */
export type RailLinksCardLayout = 'chips' | 'list' | 'media' | 'ranked';

interface RailLinksCardProps {
  title: string;
  items: readonly RailLinksCardItem[];
  layout?: RailLinksCardLayout;
  moreLink?: {
    href: string;
    label: string;
    trackingLabel?: string;
  };
  /** GA4 nav_surface。必須 (未指定だとクリックが計測されないまま静かに落ちる) */
  trackingSurface: NavSurface;
  /** 狭幅で本文下へ積まれるとき details/summary で畳む (見た目は RailCard 共通) */
  collapsible?: boolean;
  /** chips を横スクロール 1 行にする (狭幅の本文上部など) */
  horizontalOnMobile?: boolean;
}

function trackLink(
  item: Pick<RailLinksCardItem, 'href' | 'label' | 'trackingLabel'>,
  surface: NavSurface
) {
  try {
    trackNavClick({
      label: item.trackingLabel ?? item.label,
      href: item.href,
      surface,
    });
  } catch {
    // 計測失敗で遷移を止めない。
  }
}

/** タグ用ピル。PC は高密度 (sm:min-h-7)、モバイルは 44px のタップ領域 (min-h-11) */
export const RAIL_CHIP_CLASS =
  'inline-flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full border border-muted-foreground/40 bg-muted px-2 text-[11px] font-medium leading-none text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-7';

function RailLinks({
  items,
  layout,
  trackingSurface,
  horizontalOnMobile,
}: Pick<
  RailLinksCardProps,
  'items' | 'layout' | 'trackingSurface' | 'horizontalOnMobile'
>) {
  if (layout === 'media') {
    return (
      <nav className="space-y-0.5" aria-label="カード内リンク">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.ariaLabel}
            className="group flex min-h-14 items-center gap-3 border-b border-border py-2.5 text-sm leading-snug text-foreground transition-colors last:border-b-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => trackLink(item, trackingSurface)}
          >
            {item.thumbnail && (
              <span className="relative aspect-[40/21] w-20 shrink-0 overflow-hidden border border-border bg-muted">
                <ThemeAwareImage
                  lightSrc={item.thumbnail.lightSrc}
                  darkSrc={item.thumbnail.darkSrc}
                  alt={item.thumbnail.alt ?? ''}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </span>
            )}
            <span className="line-clamp-2 min-w-0 flex-1">{item.label}</span>
            <ChevronRight
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </nav>
    );
  }

  if (layout === 'ranked') {
    return (
      <ol aria-label="カード内リンク">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-border last:border-b-0">
            <Link
              href={item.href}
              aria-label={item.ariaLabel}
              className="group flex min-h-12 items-center gap-3 py-2.5 text-sm leading-snug text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => trackLink(item, trackingSurface)}
            >
              {item.thumbnail ? (
                <span className="relative aspect-[40/21] w-20 shrink-0 overflow-hidden border border-border bg-muted">
                  <ThemeAwareImage
                    lightSrc={item.thumbnail.lightSrc}
                    darkSrc={item.thumbnail.darkSrc}
                    alt={item.thumbnail.alt ?? ''}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </span>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
              )}
              <span className="line-clamp-2">{item.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    );
  }

  if (layout === 'list') {
    return (
      <nav className="-mx-2 flex flex-col" aria-label="カード内リンク">
        {items.map((item) => (
          <RailNavRow
            key={item.id}
            href={item.href}
            aria-label={item.ariaLabel}
            active={item.active}
            trailing={
              item.count !== undefined
                ? item.count.toLocaleString('ja-JP')
                : undefined
            }
            onClick={() => trackLink(item, trackingSurface)}
          >
            {item.label}
          </RailNavRow>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap gap-1.5',
        horizontalOnMobile &&
          '-mx-1 flex-nowrap snap-x overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      )}
      aria-label="カード内リンク"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-label={item.ariaLabel}
          className={RAIL_CHIP_CLASS}
          onClick={() => trackLink(item, trackingSurface)}
        >
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span
              aria-hidden="true"
              className="text-[10px] tabular-nums text-muted-foreground"
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** 独立した共通リンクカード (chips / list / media / ranked)。枠・見出し・折りたたみは RailCard が持つ。 */
export function RailLinksCard({
  title,
  items,
  layout = 'chips',
  moreLink,
  trackingSurface,
  collapsible = false,
  horizontalOnMobile = false,
}: RailLinksCardProps) {
  return (
    <RailCard title={title} aria-label={title} collapsible={collapsible}>
      <RailLinks
        items={items}
        layout={layout}
        trackingSurface={trackingSurface}
        horizontalOnMobile={horizontalOnMobile}
      />
      {moreLink && (
        <Link
          href={moreLink.href}
          className="mt-3 inline-flex min-h-11 items-center text-xs sm:min-h-6 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
          onClick={() =>
            trackLink(
              {
                href: moreLink.href,
                label: moreLink.label,
                trackingLabel: moreLink.trackingLabel,
              },
              trackingSurface
            )
          }
        >
          {moreLink.label}
        </Link>
      )}
    </RailCard>
  );
}
