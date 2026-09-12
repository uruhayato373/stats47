import { findGeoLayer } from '@stats47/data-configs/business-plan';

import type { GeoAnalysisPrefDetail } from '@stats47/gis';

type Base = { areaCode: string; areaName: string; generatedAt: string };
export type GeoLayerData = Base &
  (
    | {
        kind: 'population';
        meshes: readonly (readonly [
          string,
          number,
          number,
          number,
          number,
          number,
          number,
        ])[];
      }
    | {
        kind: 'land-price';
        points: readonly (readonly [
          string,
          number,
          number,
          number,
          number | null,
        ])[];
      }
    | {
        kind: 'stations';
        stations: readonly (readonly [string, string, number, number])[];
      }
  );

/** Strip all cross-analysis classifications before sending a single layer to the browser. */
export function projectGeoLayer(
  slug: string,
  detail: GeoAnalysisPrefDetail
): GeoLayerData | null {
  const layer = findGeoLayer(slug);
  if (!layer || detail.slug !== layer.sourceAnalysis) return null;
  const base = {
    areaCode: detail.areaCode,
    areaName: detail.areaName,
    generatedAt: detail.generatedAt,
  };
  if (layer.kind === 'population')
    return {
      ...base,
      kind: 'population',
      meshes: detail.meshes.map(
        ([id, w, s, e, n, p0, p1]) => [id, w, s, e, n, p0, p1] as const
      ),
    };
  if (layer.kind === 'land-price' && detail.slug === 'population-land-price')
    return { ...base, kind: 'land-price', points: detail.landPricePoints };
  if (layer.kind === 'stations' && detail.slug === 'population-station-access')
    return { ...base, kind: 'stations', stations: detail.stations };
  return null;
}

export function populationLayerColor(value: number) {
  return value === 0
    ? '#e2e8f0'
    : value < 100
      ? '#c6dbef'
      : value < 1000
        ? '#6baed6'
        : value < 5000
          ? '#2171b5'
          : '#08306b';
}
