import data from '../../../../data/geo/analyses/layers.json';
import type { GeoAnalysisSlug } from './geo-analyses';

/**
 * Public single-layer views. Only verified, renderable representations get routes.
 * 記録の正本は台帳 `geo.layers` (data/geo/analyses/layers.json + Schema)。ここは型を付けて export するだけ。
 */
export const GEO_LAYER_KINDS = ['population', 'land-price', 'stations'] as const;
export type GeoLayerKind = (typeof GEO_LAYER_KINDS)[number];

export type GeoLayerSlug = keyof typeof data.layers;

/**
 * 層の値を配信する分析。web が `layer.sourceAnalysis` のリテラル型で県別 bundle の型を絞るので、
 * 台帳の値をここに並べた 2 分析に限り、外れたら読み込み時に throw する (Schema の enum も同じ)。
 */
export const GEO_LAYER_SOURCE_ANALYSES = [
  'population-land-price',
  'population-station-access',
] as const satisfies readonly GeoAnalysisSlug[];
export type GeoLayerSourceAnalysis = (typeof GEO_LAYER_SOURCE_ANALYSES)[number];

export interface GeoLayer {
  readonly slug: GeoLayerSlug;
  readonly name: string;
  readonly kind: GeoLayerKind;
  /** KSJ 台帳 (geo.ksj-datasets) の dataId */
  readonly dataId: string;
  readonly sourceAnalysis: GeoLayerSourceAnalysis;
  readonly representation: string;
  readonly description: string;
  readonly reading: string;
  readonly limitation: string;
  readonly related: readonly GeoAnalysisSlug[];
}

type RawGeoLayer = Omit<GeoLayer, 'slug'>;

const RECORDS = data.layers as Record<GeoLayerSlug, RawGeoLayer>;

export const GEO_LAYERS: readonly GeoLayer[] = (
  Object.keys(RECORDS) as GeoLayerSlug[]
).map((slug) => {
  const layer = RECORDS[slug];
  if (!GEO_LAYER_SOURCE_ANALYSES.includes(layer.sourceAnalysis)) {
    throw new Error(`Geo層 ${slug} の sourceAnalysis ${layer.sourceAnalysis} は GEO_LAYER_SOURCE_ANALYSES にありません`);
  }
  return { slug, ...layer };
});

export function findGeoLayer(slug: string): GeoLayer | undefined {
  return GEO_LAYERS.find((layer) => layer.slug === slug);
}
