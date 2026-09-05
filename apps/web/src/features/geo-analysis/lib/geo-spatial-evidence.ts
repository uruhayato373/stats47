import type { GeoAnalysisPrefDetail } from '@stats47/gis';
import type { FeatureCollection, Polygon } from 'geojson';

export type SpatialView = 'population' | 'overlap' | 'audit';

export const POPULATION_LEGEND =
  '人口変化：青緑＝維持・増加、青＝15%未満減少、橙＝15〜30%減少、赤＝30%以上減少、灰＝基準人口0。';

export function landPointCategory(
  detail: Extract<GeoAnalysisPrefDetail, { slug: 'population-land-price' }>,
  index: number,
  meshes: ReadonlyMap<
    string,
    GeoAnalysisPrefDetail['meshes'][number]
  > = new Map(detail.meshes.map((mesh) => [mesh[0], mesh]))
) {
  const point = detail.landPricePoints[index];
  const id = detail.pointMeshIds[index];
  const mesh = id ? meshes.get(id) : undefined;
  if (!point || !mesh) return { label: '人口メッシュ未接続', color: '#64748b' };
  if (point[4] === null || mesh[5] <= 0)
    return { label: '比較対象外', color: '#64748b' };
  const rising = point[4] > 0;
  const declining = mesh[6] < mesh[5];
  if (rising && declining)
    return { label: '地価上昇 × 人口減少', color: '#b91c1c' };
  if (rising) return { label: '地価上昇 × 人口維持・増加', color: '#0f766e' };
  if (declining)
    return { label: '地価横ばい・下落 × 人口減少', color: '#b45309' };
  return { label: '地価横ばい・下落 × 人口維持・増加', color: '#1d4ed8' };
}

export function buildSpatialMeshMap(
  detail: GeoAnalysisPrefDetail
): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: detail.meshes.map((mesh) => {
      const [id, w, s, e, n, p2020, p2050] = mesh;
      return {
        type: 'Feature',
        id,
        properties: {
          id,
          p2020,
          p2050,
          change: p2020 > 0 ? ((p2050 - p2020) / p2020) * 100 : null,
          included: (mesh[7] ?? 0) > 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [w / 1e6, s / 1e6],
              [e / 1e6, s / 1e6],
              [e / 1e6, n / 1e6],
              [w / 1e6, n / 1e6],
              [w / 1e6, s / 1e6],
            ],
          ],
        },
      };
    }),
  };
}

export function spatialAuditRows(
  detail: GeoAnalysisPrefDetail
): { label: string; value: string }[] {
  const people = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}人`;
  if (detail.slug === 'population-land-price') {
    const s = detail.summary;
    return [
      {
        label: '接続地点 + 未接続地点 = 全住宅地点',
        value: `${s.matchedPointCount} + ${s.unmatchedPointCount} = ${s.pointCount}地点`,
      },
      {
        label: '比較可能 / 接続したが比較不能',
        value: `${s.comparablePointCount} / ${s.matchedPointCount - s.comparablePointCount}地点`,
      },
      {
        label: '地価上昇 × 人口減少 / 比較可能地点',
        value: `${s.risingDecliningPointCount} / ${s.comparablePointCount}地点 = ${s.risingDecliningPointShare === null ? '算出不可' : `${s.risingDecliningPointShare}%`}`,
      },
    ];
  }
  const s = detail.summary;
  const inside2020 =
    detail.slug === 'population-flood-risk'
      ? detail.summary.exposedPopulation2020
      : detail.summary.accessiblePopulation2020;
  const inside2050 =
    detail.slug === 'population-flood-risk'
      ? detail.summary.exposedPopulation2050
      : detail.summary.accessiblePopulation2050;
  return [
    {
      label: '2020年：判定内 + 判定外 = 全人口',
      value: `${people(inside2020)} + ${people(s.population2020 - inside2020)} = ${people(s.population2020)}`,
    },
    {
      label: '2050年：判定内 + 判定外 = 全人口',
      value: `${people(inside2050)} + ${people(s.population2050 - inside2050)} = ${people(s.population2050)}`,
    },
    {
      label: '同じ空間条件で比較した人口比率',
      value: `${s.population2020 > 0 ? ((inside2020 / s.population2020) * 100).toFixed(1) : '—'}% → ${s.population2050 > 0 ? ((inside2050 / s.population2050) * 100).toFixed(1) : '—'}%`,
    },
  ];
}
