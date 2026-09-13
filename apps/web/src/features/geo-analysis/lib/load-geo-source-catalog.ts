import 'server-only';
import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  GEO_SOURCE_CATALOG_KEY,
  parseGeoSourceCatalog,
  parseGeoSourceItem,
} from './geo-source-catalog';

export async function loadGeoSourceCatalog() {
  try {
    const catalog = parseGeoSourceCatalog(
      await fetchFromR2AsJson<unknown>(GEO_SOURCE_CATALOG_KEY)
    );
    if (!catalog) return null;
    return {
      ...catalog,
      items: catalog.items.filter((item) => {
        const meta = GIS_DATASETS_BY_ID.get(item.dataId);
        return (
          meta &&
          meta.latestVersion === item.version &&
          getKsjLicensePolicy(meta.license).sourcePublication ===
            'public-r2-eligible'
        );
      }),
    };
  } catch {
    return null;
  }
}

export async function loadGeoSourceItem(dataId: string) {
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  if (
    !meta ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    return null;
  try {
    const item = parseGeoSourceItem(
      await fetchFromR2AsJson<unknown>(`app/geo/datasets/${dataId}/item.json`)
    );
    return item?.dataId === dataId && item.version === meta.latestVersion
      ? item
      : null;
  } catch {
    return null;
  }
}
