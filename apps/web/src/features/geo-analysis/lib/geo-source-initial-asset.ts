import type { GeoSourceAsset } from './geo-source-catalog';

const MAX_INITIAL_BYTES = 8_000_000;

/** Open one bounded-size file; mesh 5339 avoids starting on remote ocean tiles. */
export function findGeoSourceInitialAsset(assets: GeoSourceAsset[]) {
  const candidates = assets.filter(
    (asset) => asset.bytes > 0 && asset.bytes < MAX_INITIAL_BYTES
  );
  return (
    candidates.find((asset) => /\/5339(?:[.-]|\/)/.test(asset.key)) ??
    candidates.find((asset) => /\/13(?:[./])/.test(asset.key)) ??
    candidates.find((asset) => asset.bytes > 100_000) ??
    candidates[0] ??
    null
  );
}
