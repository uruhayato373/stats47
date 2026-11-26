import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import { buttonVariants } from '@stats47/components/atoms/ui/button';
import { ArrowRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { navSurfaceProps, type NavSurface } from '@/lib/analytics/events';

import { readContentRecommendations } from './server';
import { SHORT_LINK_BUTTON_TONE } from './short-link-button.palette';

import type { ContentContext, ContentRecommendation } from '@stats47/data-configs/content/navigation';

/** `icon` は見出しの左のアイコン (RailLinksCard の icon)。省略時は RailLinksCard の既定。 */
export async function RelatedContentNavigation({
  title,
  surface,
  icon,
  itemIcon,
  linkLabel,
  ...context
}: ContentContext & {
  title: string;
  surface: NavSurface;
  icon?: ReactNode;
  /** 各行の左端のアイコン */
  itemIcon?: (item: ContentRecommendation) => ReactNode;
  linkLabel?: string;
}) {
  const items = await readContentRecommendations(context);
  if (linkLabel) {
    const item = items[0];
    if (!item) return null;
    return (
      <Link
        href={item.href}
        title={item.title}
        // 青い塗りのボタンにして目立たせる (2026-11-26 オーナー判断。文字のリンクでは見落とされやすく、
        // 行き先の市区町村ランキングは検索でも強いページなので回遊させたい)
        className={cn(buttonVariants({ variant: 'default', size: 'sm' }), SHORT_LINK_BUTTON_TONE, 'min-h-11 sm:min-h-7')}
        {...navSurfaceProps(surface)}
        data-nav-label={item.id}
        data-content-id={item.id}
      >
        {linkLabel}<ArrowRight aria-hidden="true" />
      </Link>
    );
  }
  return <ContentNavigation title={title} surface={surface} icon={icon} itemIcon={itemIcon} items={items} />;
}
