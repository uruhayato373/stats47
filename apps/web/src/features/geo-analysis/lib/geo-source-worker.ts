import { feature } from 'topojson-client';

import { sampleGeoSourceFeatures } from './geo-source-sampling';

import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryObject } from 'topojson-specification';

type Bounds = [number, number, number, number];
const MAX_VISIBLE = 3000;
let records: { feature: Feature; bounds: Bounds }[] = [];
const scope = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
};
function geometryBounds(geometry: Geometry): Bounds {
  const result: Bounds = [Infinity, Infinity, -Infinity, -Infinity];
  function coordinates(value: unknown) {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      if (
        !Number.isFinite(value[0]) ||
        !Number.isFinite(value[1]) ||
        Math.abs(value[0]) > 180 ||
        Math.abs(value[1]) > 90
      )
        throw Error('緯度経度として扱えない座標が含まれています。');
      result[0] = Math.min(result[0], value[0]);
      result[1] = Math.min(result[1], value[1]);
      result[2] = Math.max(result[2], value[0]);
      result[3] = Math.max(result[3], value[1]);
    } else value.forEach(coordinates);
  }
  function visit(g: Geometry) {
    if (g.type === 'GeometryCollection') g.geometries.forEach(visit);
    else coordinates(g.coordinates);
  }
  visit(geometry);
  return result;
}
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      const response = await fetch(data.url);
      if (!response.ok) throw Error('地図データを読み込めませんでした。');
      let buffer = await response.arrayBuffer();
      const signature = new Uint8Array(
        buffer,
        0,
        Math.min(2, buffer.byteLength)
      );
      if (signature[0] === 31 && signature[1] === 139)
        buffer = await new Response(
          new Blob([buffer])
            .stream()
            .pipeThrough(new DecompressionStream('gzip'))
        ).arrayBuffer();
      const value = JSON.parse(new TextDecoder().decode(buffer));
      let features: Feature[] = [];
      if (value?.type === 'Topology' && value.objects && value.arcs) {
        for (const object of Object.values(value.objects)) {
          const converted = feature(
            value as Topology,
            object as GeometryObject
          );
          for (const current of converted.type === 'FeatureCollection'
            ? converted.features
            : [converted])
            features.push(current);
        }
      } else if (
        value?.type === 'FeatureCollection' &&
        Array.isArray(value.features)
      )
        features = value.features;
      else throw Error('対応していない地図データ形式です。');
      records = features
        .filter((f) => f.geometry)
        .map((f) => ({ feature: f, bounds: geometryBounds(f.geometry) }))
        .filter((r) => r.bounds.every(Number.isFinite));
      if (!records.length)
        throw Error('この配布区画には表示できる地物がありません。');
      const bounds: Bounds = [Infinity, Infinity, -Infinity, -Infinity];
      for (const record of records) {
        bounds[0] = Math.min(bounds[0], record.bounds[0]);
        bounds[1] = Math.min(bounds[1], record.bounds[1]);
        bounds[2] = Math.max(bounds[2], record.bounds[2]);
        bounds[3] = Math.max(bounds[3], record.bounds[3]);
      }
      scope.postMessage({ type: 'ready', bounds, total: records.length });
    } else if (data.type === 'view') {
      const [w, s, e, n] = data.bounds as Bounds;
      const { matched, selected } = sampleGeoSourceFeatures(
        records,
        (record) =>
          record.bounds[0] <= e &&
          record.bounds[2] >= w &&
          record.bounds[1] <= n &&
          record.bounds[3] >= s,
        MAX_VISIBLE
      );
      scope.postMessage({
        type: 'view',
        collection: {
          type: 'FeatureCollection',
          features: selected.map((record) => record.feature),
        } satisfies FeatureCollection,
        matched,
        total: records.length,
      });
    }
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : '地図の読み込みに失敗しました。',
    });
  }
};
