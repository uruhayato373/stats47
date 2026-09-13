import { GIS_DATASETS, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';

import type { GeoSourceCatalog } from './geo-source-catalog';

export const GEO_SOURCE_CATEGORIES = {
  land: '土地・自然',
  policy: '区域・防災',
  facility: '施設',
  transport: '交通',
  statistics: '統計',
};

/** Keep every eligible source discoverable, even before its map is available. */
export function getGeoSourceNavigation(catalog: GeoSourceCatalog | null) {
  const available = new Map(catalog?.items.map((item) => [item.dataId, item]));
  let position = 0;
  return Object.entries(GEO_SOURCE_CATEGORIES).map(([category, label]) => ({
    category,
    label,
    items: GIS_DATASETS.filter(
      (meta) =>
        meta.category === category &&
        getKsjLicensePolicy(meta.license).sourcePublication ===
          'public-r2-eligible'
    ).map((meta) => ({
      dataId: meta.dataId,
      name: meta.name,
      href: `/geo/datasets/${meta.dataId}`,
      position: ++position,
      status: !catalog
        ? ('unknown' as const)
        : available.get(meta.dataId)?.version === meta.latestVersion
          ? ('ready' as const)
          : ('preparing' as const),
    })),
  }));
}
