import { GEO_ANALYSES, GEO_LAYERS } from '@stats47/data-configs/business-plan';

type GeoAnalysisSlug = (typeof GEO_ANALYSES)[number]['slug'];
type GeoLayerSlug = (typeof GEO_LAYERS)[number]['slug'];

/**
 * Hub / rail 向けの短いラベル。詳細ページの正式タイトルは変えず、
 * 一覧では組み合わせを先に読める長さへ揃える。
 */
export const GEO_HOME_ANALYSIS_LABELS = {
  'population-land-price': '地価 × 将来人口',
  'population-flood-risk': '洪水 × 将来人口',
  'population-station-access': '駅800m圏 × 将来人口',
  'population-snow-designation': '豪雪指定 × 人口',
  'population-landslide-exposure': '土砂災害 × 人口・施設',
  'population-public-facility-access': '公共施設距離 × 人口',
} as const satisfies Record<GeoAnalysisSlug, string>;

export const GEO_HOME_ANALYSIS_NAV_ITEMS = GEO_ANALYSES.map((analysis) => ({
  id: analysis.slug,
  label: GEO_HOME_ANALYSIS_LABELS[analysis.slug],
  href: `/geo/${analysis.slug}`,
}));

/** 公開済みで単体表示できるGISだけを、正典の表示名・順序で案内する。 */
export const GEO_HOME_LAYER_NAV_ITEMS = GEO_LAYERS.map((layer) => ({
  id: layer.slug,
  label: layer.name,
  href: `/geo/layers/${layer.slug}`,
}));

export function getGeoHomeLayerNavItems(activeLayerSlug?: GeoLayerSlug) {
  return GEO_HOME_LAYER_NAV_ITEMS.map((item) => ({
    ...item,
    active: item.id === activeLayerSlug,
  }));
}
