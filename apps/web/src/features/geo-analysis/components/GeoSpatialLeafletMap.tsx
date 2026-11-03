'use client';

import { useMemo } from 'react';

import { CircleMarker, GeoJSON, Popup, Tooltip } from 'react-leaflet';

import { LeafletMapFrame } from '@/components/charts/LeafletMapFrame';

import { GEO_MAP_COLORS } from '../lib/geo-map.palette';
import {
  buildSpatialMeshMap,
  landPointCategory,
  type SpatialView,
} from '../lib/geo-spatial-evidence';


import type { GeoAnalysisPrefDetail } from '@stats47/gis';
import type { LatLngBoundsExpression } from 'leaflet';

export function GeoSpatialLeafletMap({
  detail,
  view,
}: {
  detail: Exclude<
    GeoAnalysisPrefDetail,
    { slug: 'population-public-facility-access' | 'population-snow-designation' | 'population-landslide-exposure' | 'population-low-elevation' }
  >;
  view: Exclude<SpatialView, 'audit'>;
}) {
  const features = useMemo(() => buildSpatialMeshMap(detail), [detail]);
  const byId = useMemo(
    () => new Map(detail.meshes.map((mesh) => [mesh[0], mesh])),
    [detail]
  );
  const center = useMemo<[number, number]>(() => {
    const mesh = detail.meshes.reduce((best, candidate) =>
      candidate[5] > best[5] ? candidate : best
    );
    return [(mesh[2] + mesh[4]) / 2e6, (mesh[1] + mesh[3]) / 2e6];
  }, [detail]);
  const bounds = useMemo<LatLngBoundsExpression>(
    () => [
      [
        Math.min(...detail.meshes.map((m) => m[2])) / 1e6,
        Math.min(...detail.meshes.map((m) => m[1])) / 1e6,
      ],
      [
        Math.max(...detail.meshes.map((m) => m[4])) / 1e6,
        Math.max(...detail.meshes.map((m) => m[3])) / 1e6,
      ],
    ],
    [detail]
  );
  const focus = useMemo(
    () => ({ center, zoom: 10, label: '人口最多メッシュ周辺' }),
    [center]
  );
  const isLand = detail.slug === 'population-land-price';
  return (
    <LeafletMapFrame
      ariaLabel={`${detail.areaName}の地点・1kmメッシュ地図`}
      bounds={bounds}
      focus={focus}
      toolbar={
        <span className="text-xs text-muted-foreground">
          表示範囲のみ変更。集計対象は県内全メッシュです。
        </span>
      }
    >
      <GeoJSON
        key={`${detail.slug}-${detail.areaCode}-${view}`}
        data={features}
        style={(feature) => {
          const change = feature?.properties?.change;
          const fillColor =
            view === 'overlap' && !isLand
              ? feature?.properties?.included
                ? GEO_MAP_COLORS.spatialInclusion.included
                : GEO_MAP_COLORS.spatialInclusion.excluded
              : typeof change !== 'number'
                ? GEO_MAP_COLORS.populationChange.missing
                : change >= 0
                  ? GEO_MAP_COLORS.populationChange.growing
                  : change >= -15
                    ? GEO_MAP_COLORS.populationChange.mildDecline
                    : change >= -30
                      ? GEO_MAP_COLORS.populationChange.moderateDecline
                      : GEO_MAP_COLORS.populationChange.severeDecline;
          return {
            color: GEO_MAP_COLORS.outline,
            weight: 0.3,
            fillColor,
            fillOpacity: isLand && view === 'overlap' ? 0.25 : 0.7,
          };
        }}
        onEachFeature={(feature, layer) => {
          const p = feature.properties;
          const node = document.createElement('span');
          node.textContent = `メッシュ ${String(p?.id)}｜2020年 ${Number(p?.p2020).toLocaleString('ja-JP')}人 → 2050年 ${Number(p?.p2050).toLocaleString('ja-JP')}人｜人口変化 ${typeof p?.change === 'number' ? p.change.toFixed(1) + '%' : '算出不可'}${!isLand ? (p?.included ? '｜今回の浸水包含判定：内' : '｜今回の浸水包含判定：外（安全を意味しません）') : ''}`;
          layer.bindTooltip(node, { sticky: true });
          layer.bindPopup(node.cloneNode(true) as HTMLElement);
        }}
      />
      {detail.slug === 'population-land-price' && view === 'overlap'
        ? detail.landPricePoints.map((point, index) => {
            const category = landPointCategory(detail, index, byId);
            const id = detail.pointMeshIds[index];
            const mesh = id ? byId.get(id) : undefined;
            return (
              <CircleMarker
                key={point[0]}
                center={[point[2] / 1e6, point[1] / 1e6]}
                radius={5}
                pathOptions={{
                  color: GEO_MAP_COLORS.outline,
                  weight: 1,
                  fillColor: category.color,
                  fillOpacity: 1,
                }}
              >
                <Tooltip>
                  <span>
                    {point[0]}：{category.label}
                    <br />
                    {point[3].toLocaleString('ja-JP')}円/㎡・前年比
                    {point[4] ?? '不明'}%<br />
                    メッシュ {id ?? '未接続'}
                    {mesh
                      ? `：${Math.round(mesh[5])}人 → ${Math.round(mesh[6])}人`
                      : ''}
                  </span>
                </Tooltip>
                <Popup>
                  <span>
                    {point[0]}：{category.label}
                    <br />
                    {point[3].toLocaleString('ja-JP')}円/㎡・前年比
                    {point[4] ?? '不明'}%<br />
                    メッシュ {id ?? '未接続'}
                    {mesh
                      ? `：2020年 ${Math.round(mesh[5])}人 → 2050年 ${Math.round(mesh[6])}人`
                      : ''}
                  </span>
                </Popup>
              </CircleMarker>
            );
          })
        : null}
    </LeafletMapFrame>
  );
}
