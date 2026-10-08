import { ContentNavigation } from '@/components/rail/ContentNavigation';

import type { NavSurface } from '@/lib/analytics/events';

import { readContentRecommendations } from './server';

import type { ContentContext } from '@stats47/data-configs/content/navigation';

export async function RelatedContentNavigation({ title, surface, ...context }: ContentContext & { title: string; surface: NavSurface }) {
  const items = await readContentRecommendations(context);
  return <ContentNavigation title={title} surface={surface} items={items} />;
}
