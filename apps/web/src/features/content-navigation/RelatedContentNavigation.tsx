import type { ReactNode } from 'react';


import { ContentNavigation } from '@/components/rail/ContentNavigation';

import type { NavSurface } from '@/lib/analytics/events';

import { readContentRecommendations } from './server';

import type { ContentContext, ContentRecommendation } from '@stats47/data-configs/content/navigation';

/** `icon` は見出しの左のアイコン (RailLinksCard の icon)。省略時は RailLinksCard の既定。 */
export async function RelatedContentNavigation({
  title,
  surface,
  icon,
  itemIcon,
  ...context
}: ContentContext & {
  title: string;
  surface: NavSurface;
  icon?: ReactNode;
  /** 各行の左端のアイコン */
  itemIcon?: (item: ContentRecommendation) => ReactNode;
}) {
  const items = await readContentRecommendations(context);
  return <ContentNavigation title={title} surface={surface} icon={icon} itemIcon={itemIcon} items={items} />;
}
