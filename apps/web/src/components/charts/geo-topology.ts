import { geoArea, geoCentroid, geoDistance, geoMercator } from 'd3-geo';
import { feature as topoFeature } from 'topojson-client';

import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

/** d3-geo で描く SVG の地図の大きさ (viewBox) と余白。地図ごとに大きさを変えない */
export const GEO_SVG_MAP = { width: 640, height: 640, padding: 16 } as const;

/** 縮尺を決めるときに外す離島の目安 (いちばん大きい陸地の中心からの距離)。小笠原諸島などで本土が小さくならないように */
const FIT_MAX_DISTANCE_KM = 450;
const EARTH_RADIUS_KM = 6371;

/** TopoJSON を取る。失敗は HTTP の状態で reject する */
export function fetchTopology(url: string): Promise<Topology> {
  return fetch(url).then((res) => (res.ok ? (res.json() as Promise<Topology>) : Promise.reject(res.status)));
}

/** TopoJSON から地物を取り出す。names の最初にある object、無ければ先頭の object を使う */
export function topologyFeatures<P>(topology: Topology, names: readonly string[] = []): Feature<Geometry, P>[] {
  const name = names.find((item) => topology.objects[item]) ?? Object.keys(topology.objects)[0];
  return (topoFeature(topology, topology.objects[name] as GeometryCollection) as FeatureCollection<Geometry, P>).features;
}

/** 地物の範囲を GEO_SVG_MAP の余白の内側に収めるメルカトル図法 */
export function fitGeoSvgMercator(features: readonly Feature[]) {
  const { width, height, padding } = GEO_SVG_MAP;
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    { type: 'FeatureCollection', features: [...features] } as FeatureCollection,
  );
}

/** 面を陸地 1 つずつ (Polygon) に分ける。点・線はそのまま */
function landParts(features: readonly Feature[]): Feature[] {
  return features.flatMap((f) =>
    f.geometry?.type === 'MultiPolygon'
      ? f.geometry.coordinates.map(
          (coordinates): Feature<Polygon> => ({ type: 'Feature', properties: null, geometry: { type: 'Polygon', coordinates } }),
        )
      : [f],
  );
}

/**
 * 縮尺を決める対象から遠い離島を外す。いちばん大きい陸地の中心から FIT_MAX_DISTANCE_KM より遠い陸地を外す
 * (県の境界は東京都なら小笠原諸島まで 1 つの形に含むので、陸地 1 つずつに分けてから測る)。
 * 全国の地図には使わない (沖縄が外れる)。外して何も残らないときは元の地物を返す
 */
export function withoutFarIslands(features: readonly Feature[]): Feature[] {
  const parts = landParts(features);
  if (parts.length < 2) return [...features];
  const largest = parts.reduce((best, f) => (geoArea(f) > geoArea(best) ? f : best));
  const center = geoCentroid(largest);
  const near = parts.filter((f) => geoDistance(center, geoCentroid(f)) * EARTH_RADIUS_KM <= FIT_MAX_DISTANCE_KM);
  return near.length > 0 ? near : [...features];
}
