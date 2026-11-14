import data from '../../../../data/themes/japan/catalogs.json';
import kakeiData from '../../../../data/themes/japan/kakei-catalogs.json';

/**
 * `/japan/<slug>` で有効な slug の一覧 (registry を import しない軽い版)。
 *
 * middleware (Edge) が URL の可否判定に読むので、指標の題を引くために全指標 registry を抱える `japan-catalog.ts` から
 * 分けて置く (MIDDLEWARE-REGISTRY-BUNDLE-01)。`JAPAN_CATALOGS` のキーと一致することはテストで固定している。
 */
export const JAPAN_THEME_SLUGS: ReadonlySet<string> = new Set([
  ...Object.keys(data.themes),
  ...Object.keys(kakeiData.themes),
]);
