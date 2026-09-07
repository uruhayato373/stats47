'use client';

import Link from 'next/link';

import { cn } from '@stats47/components';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';
import { RailCard, SurfaceSection } from '@/components/surface';

import { trackNavClick, type NavSurface } from '@/lib/analytics/events';

export interface RailLinksCardItem {
  id: string;
  label: string;
  href: string;
  count?: number;
  ariaLabel?: string;
  trackingLabel?: string;
  thumbnail?: {
    lightSrc: string;
    darkSrc: string;
    alt?: string;
  };
}

interface RailLinksCardProps {
  title: string;
  items: readonly RailLinksCardItem[];
  layout?: 'chips' | 'grid' | 'list' | 'media' | 'ranked';
  moreLink?: {
    href: string;
    label: string;
    trackingLabel?: string;
  };
  trackingSurface?: NavSurface;
  collapsible?: boolean;
  horizontalOnMobile?: boolean;
}

function trackLink(
  item: Pick<RailLinksCardItem, 'href' | 'label' | 'trackingLabel'>,
  surface?: NavSurface
) {
  if (!surface) return;

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
      <ol>
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
                  <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </span>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary/10 text-[11px] font-bold text-primary">
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

  if (layout === 'grid') {
    return (
      <nav className="grid grid-cols-2 gap-2" aria-label="カード内リンク">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.ariaLabel}
            className="flex min-h-9 items-center border border-border bg-muted px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => trackLink(item, trackingSurface)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  if (layout === 'list') {
    return (
      <nav className="space-y-0.5" aria-label="カード内リンク">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.ariaLabel}
            className="flex min-h-9 items-center justify-between gap-2 px-1 text-sm text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => trackLink(item, trackingSurface)}
          >
            <span>{item.label}</span>
            <ChevronRight
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap gap-2',
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
          className="inline-flex min-h-8 shrink-0 snap-start items-center gap-1 border border-border bg-muted px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => trackLink(item, trackingSurface)}
        >
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span aria-hidden="true" className="text-muted-foreground">
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function CardBody({
  items,
  layout,
  moreLink,
  trackingSurface,
  horizontalOnMobile,
}: Omit<RailLinksCardProps, 'title' | 'collapsible'>) {
  return (
    <>
      <RailLinks
        items={items}
        layout={layout}
        trackingSurface={trackingSurface}
        horizontalOnMobile={horizontalOnMobile}
      />
      {moreLink && (
        <Link
          href={moreLink.href}
          className="mt-3 inline-flex text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </>
  );
}

/** チップ・グリッド・リスト・順位表に対応する、独立した共通リンクカード。 */
export function RailLinksCard({
  title,
  items,
  layout = 'chips',
  moreLink,
  trackingSurface,
  collapsible = false,
  horizontalOnMobile = false,
}: RailLinksCardProps) {
  const body = (
    <CardBody
      items={items}
      layout={layout}
      moreLink={moreLink}
      trackingSurface={trackingSurface}
      horizontalOnMobile={horizontalOnMobile}
    />
  );

  if (collapsible) {
    return (
      <SurfaceSection className="overflow-hidden p-0" aria-label={title}>
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
            <h3>{title}</h3>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-border px-4 pb-4 pt-3">{body}</div>
        </details>
      </SurfaceSection>
    );
  }

  return (
    <RailCard title={title} aria-label={title}>
      {body}
    </RailCard>
  );
}
