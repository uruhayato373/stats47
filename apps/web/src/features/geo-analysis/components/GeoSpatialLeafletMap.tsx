'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import { GEO_BASEMAP } from '../lib/geo-basemap';
import {
  buildSpatialMeshMap,
  landPointCategory,
  type SpatialView,
} from '../lib/geo-spatial-evidence';

import type { GeoAnalysisPrefDetail } from '@stats47/gis';
import type { LatLngBoundsExpression } from 'leaflet';

function Fit({
  bounds,
  center,
  extent,
}: {
  bounds: LatLngBoundsExpression;
  center: [number, number];
  extent: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (extent) map.fitBounds(bounds, { padding: [16, 16], maxZoom: 11 });
    else map.setView(center, 10);
  }, [map, bounds, center, extent]);
  return null;
}

export function GeoSpatialLeafletMap({
  detail,
  view,
}: {
  detail: GeoAnalysisPrefDetail;
  view: Exclude<SpatialView, 'audit'>;
}) {
  const [extent, setExtent] = useState(false);
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
  const isLand = detail.slug === 'population-land-price';
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={extent ? 'outline' : 'default'}
          aria-pressed={!extent}
          onClick={() => setExtent(false)}
        >
          人口最多メッシュ周辺
        </Button>
        <Button
          size="sm"
          variant={extent ? 'default' : 'outline'}
          aria-pressed={extent}
          onClick={() => setExtent(true)}
        >
          離島を含む全県
        </Button>
        <span className="text-xs text-muted-foreground">
          表示範囲のみ変更。集計対象は県内全メッシュです。
        </span>
      </div>
      <MapContainer
        preferCanvas
        center={[36, 138]}
        zoom={6}
        // Tabs can unmount the map immediately after zoom; do not leave a zoom-end timer.
        zoomAnimation={false}
        minZoom={GEO_BASEMAP.minZoom}
        maxZoom={GEO_BASEMAP.maxZoom}
        scrollWheelZoom={false}
        className="h-[480px] rounded-none lg:h-[620px]"
        aria-label={`${detail.areaName}の地点・1kmメッシュ地図`}
      >
        <TileLayer
          url={GEO_BASEMAP.url}
          attribution={GEO_BASEMAP.attribution}
        />
        <GeoJSON
          key={`${detail.slug}-${detail.areaCode}-${view}`}
          data={features}
          style={(feature) => {
            const change = feature?.properties?.change;
            const fillColor =
              view === 'overlap' && !isLand
                ? feature?.properties?.included
                  ? '#b91c1c'
                  : '#cbd5e1'
                : typeof change !== 'number'
                  ? '#94a3b8'
                  : change >= 0
                    ? '#0f766e'
                    : change >= -15
                      ? '#67a9cf'
                      : change >= -30
                        ? '#fdbb84'
                        : '#b91c1c';
            return {
              color: '#ffffff',
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
                    color: '#ffffff',
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
        <Fit bounds={bounds} center={center} extent={extent} />
      </MapContainer>
    </div>
  );
}
