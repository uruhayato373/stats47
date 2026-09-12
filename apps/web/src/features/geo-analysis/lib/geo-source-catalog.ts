export const GEO_SOURCE_CATALOG_KEY = 'app/geo/layers/items.json';
export type GeoSourceAsset = { key: string; label: string; bytes: number };
export type GeoSourceItem = {
  dataId: string;
  version: string;
  sourceUrl: string;
  assets: GeoSourceAsset[];
};
export type GeoSourceCatalog = {
  schemaVersion: 1;
  generatedAt: string;
  items: (Omit<GeoSourceItem, 'assets'> & { assetCount: number })[];
};

export function parseGeoSourceCatalog(value: unknown): GeoSourceCatalog | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<GeoSourceCatalog>;
  if (
    v.schemaVersion !== 1 ||
    typeof v.generatedAt !== 'string' ||
    !Array.isArray(v.items)
  )
    return null;
  const ids = new Set<string>();
  for (const item of v.items) {
    if (
      !item ||
      typeof item.dataId !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(item.dataId) ||
      ids.has(item.dataId) ||
      typeof item.version !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(item.version) ||
      typeof item.sourceUrl !== 'string' ||
      !item.sourceUrl.startsWith('https://nlftp.mlit.go.jp/') ||
      !Number.isInteger(item.assetCount) ||
      item.assetCount < 1
    )
      return null;
    ids.add(item.dataId);
  }
  return v as GeoSourceCatalog;
}

export function parseGeoSourceItem(value: unknown): GeoSourceItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as GeoSourceItem;
  if (
    !Array.isArray(item.assets) ||
    !parseGeoSourceCatalog({
      schemaVersion: 1,
      generatedAt: 'validation',
      items: [{ ...item, assetCount: item.assets.length }],
    })
  )
    return null;
  const keys = new Set<string>();
  for (const asset of item.assets) {
    if (
      !asset ||
      typeof asset.key !== 'string' ||
      !asset.key.startsWith(`gis/mlit-ksj/${item.dataId}/${item.version}/`) ||
      !/^[a-zA-Z0-9/_.-]+\.(?:topojson|geojson)$/.test(asset.key) ||
      asset.key.includes('..') ||
      keys.has(asset.key) ||
      typeof asset.label !== 'string' ||
      !Number.isFinite(asset.bytes) ||
      asset.bytes < 0
    )
      return null;
    keys.add(asset.key);
  }
  return item;
}
