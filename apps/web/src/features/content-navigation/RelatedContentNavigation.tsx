import type { ReactNode } from 'react';

import { buttonVariants } from '@stats47/components/atoms/ui/button';
import { ArrowRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { navSurfaceProps, type NavSurface } from '@/lib/analytics/events';

import { readContentRecommendations } from './server';

import type { ContentContext } from '@stats47/data-configs/content/navigation';

/** `icon` は見出しの左のアイコン (RailLinksCard の icon)。省略時は RailLinksCard の既定。 */
export async function RelatedContentNavigation({
  title,
  surface,
  icon,
  linkLabel,
  ...context
}: ContentContext & { title: string; surface: NavSurface; icon?: ReactNode; linkLabel?: string }) {
  const items = await readContentRecommendations(context);
  if (linkLabel) {
    const item = items[0];
    if (!item) return null;
    return (
      <Link
        href={item.href}
        title={item.title}
        className={`${buttonVariants({ variant: 'link', size: 'sm' })} min-h-11 sm:min-h-7`}
        {...navSurfaceProps(surface)}
        data-nav-label={item.id}
        data-content-id={item.id}
      >
        {linkLabel}<ArrowRight aria-hidden="true" />
      </Link>
    );
  }
  return <ContentNavigation title={title} surface={surface} icon={icon} items={items} />;
}
