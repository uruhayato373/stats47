import {
  findGeoLayer,
  type GeoLayerSlug,
} from '@stats47/data-configs/business-plan';

import { RailLinksCard, RailStack } from '@/components/rail';

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
          href: `/geo/${layer.sourceAnalysis}`,
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
      <RailLinksCard
        title={mobile ? 'GISを切り替える' : 'GIS一覧'}
        layout="list"
        trackingSurface="geo_sidebar"
        items={layerItems}
        moreLink={{ href: '/geo/layers', label: 'すべてのGISを探す →' }}
        collapsible={mobile}
      />
      <RailLinksCard
        title="関連する情報"
        layout="list"
        trackingSurface="geo_sidebar"
        items={relatedItems}
        collapsible={mobile}
      />
    </RailStack>
  );
}
