import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';
import {
  findGeoLayer,
  type GeoLayerSlug,
} from '@stats47/data-configs/business-plan';
import { hrefFor } from '@stats47/data-configs/content/href';

import Link from '@/components/atoms/SiteLink';
import { RailStack } from '@/components/rail';
import { RailCard } from '@/components/surface';

import { navSurfaceProps } from '@/lib/analytics/events';

import {
  GEO_HOME_ANALYSIS_LABELS,
  getGeoHomeLayerNavItems,
} from '../lib/geo-home-copy';

export function GeoLayerNavigation({
  activeLayerSlug,
  mobile = false,
}: {
  activeLayerSlug: GeoLayerSlug;
  mobile?: boolean;
}) {
  const layer = findGeoLayer(activeLayerSlug);
  const layerItems = getGeoHomeLayerNavItems(activeLayerSlug);
  const relatedItems = layer
    ? [
        {
          id: 'analysis',
          label: `${GEO_HOME_ANALYSIS_LABELS[layer.sourceAnalysis]}の分析`,
          href: hrefFor('geo', { analysisSlug: layer.sourceAnalysis }),
        },
        {
          id: 'method',
          label: '地図の読み方・限界',
          href: '/geo/method',
        },
        {
          id: 'sources',
          label: '使用データと利用条件',
          href: '/geo/data-catalog',
        },
      ]
    : [];

  return (
    <RailStack>
      <RailCard
        title={mobile ? 'GISを切り替える' : 'GIS一覧'}
        aria-label={mobile ? 'GISを切り替える' : 'GIS一覧'}
        collapsible={mobile}
        bodyClassName="p-0"
      >
        <GeoLayerMenu
          items={[
            ...layerItems,
            {
              id: 'all-layers',
              label: 'すべてのGISを探す →',
              href: '/geo/layers',
              active: false,
            },
          ]}
        />
      </RailCard>
      <RailCard
        title="関連する情報"
        aria-label="関連する情報"
        collapsible={mobile}
        bodyClassName="p-0"
      >
        <GeoLayerMenu items={relatedItems} />
      </RailCard>
    </RailStack>
  );
}

/**
 * GIS の切替リンク。テンプレートの SidebarMenu で描く。
 * Server Component のまま、nav_click は共通のクリック監視 (NavClickTracker) が
 * data-nav-surface="geo_sidebar" と data-nav-label (表示名) から送る (旧 RailLinksCard と同じ値)。
 * SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う。
 */
function GeoLayerMenu({
  items,
}: {
  items: ReadonlyArray<{ id: string; label: string; href: string; active?: boolean }>;
}) {
  return (
    <SidebarGroup className="p-2">
      <nav aria-label="カード内リンク" {...navSurfaceProps('geo_sidebar')}>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuSubButton
                isActive={item.active}
                aria-current={item.active ? 'page' : undefined}
                data-nav-label={item.label}
                className="h-auto min-h-11 translate-x-0 py-1.5 sm:min-h-8"
                render={<Link href={item.href} />}
              >
                <span>{item.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </nav>
    </SidebarGroup>
  );
}
