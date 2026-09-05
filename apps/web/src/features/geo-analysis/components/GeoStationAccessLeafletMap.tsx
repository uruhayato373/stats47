'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo } from 'react';

import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import { buildGeoStationAccessMapModel } from '../lib/build-geo-station-access-map-model';
import { GEO_BASEMAP } from '../lib/geo-basemap';

import type { GeoStationAccessView } from '../lib/geo-station-access-evidence';
import type { GeoStationAccessPrefDetail } from '@stats47/gis';
import type { Feature, Geometry } from 'geojson';
import type { LatLngBoundsExpression, PathOptions } from 'leaflet';

interface Props {
  detail: GeoStationAccessPrefDetail;
  view: Exclude<GeoStationAccessView, 'audit'>;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16], maxZoom: 11 });
  }, [bounds, map]);
  return null;
}

function populationColor(changeRate: number | null): string {
  if (changeRate === null) return '#94a3b8';
  if (changeRate >= 0) return '#0f766e';
  if (changeRate >= -15) return '#67a9cf';
  if (changeRate >= -30) return '#fdbb84';
  return '#b91c1c';
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character
  );
}

/** 県内1kmメッシュを人口変化または駅800m圏で切り替えて表示する。 */
export function GeoStationAccessLeafletMap({ detail, view }: Props) {
  const model = useMemo(
    () =>
      buildGeoStationAccessMapModel(
        detail,
        view === 'overlap' ? 'accessible' : 'population-core'
      ),
    [detail, view]
  );
  const style = (
    feature?: Feature<Geometry, Record<string, unknown>>
  ): PathOptions => {
    const properties = feature?.properties;
    const accessible = properties?.accessible === true;
    const fillColor =
      view === 'overlap'
        ? accessible
          ? '#0f766e'
          : '#cbd5e1'
        : populationColor(
            typeof properties?.changeRate === 'number'
              ? properties.changeRate
              : null
          );
    return {
      color: '#ffffff',
      weight: 0.35,
      fillColor,
      fillOpacity: view === 'overlap' ? (accessible ? 0.78 : 0.28) : 0.72,
    };
  };

  return (
    <MapContainer
      key={detail.areaCode}
      preferCanvas
      center={[36.5, 137.5]}
      zoom={6}
      // Tabs can unmount the map immediately after zoom; do not leave a zoom-end timer.
      zoomAnimation={false}
      minZoom={GEO_BASEMAP.minZoom}
      maxZoom={14}
      scrollWheelZoom={false}
      className="h-[480px] overflow-hidden rounded-none lg:h-[620px]"
      aria-label={`${detail.areaName}の1kmメッシュ分析地図`}
    >
      <TileLayer url={GEO_BASEMAP.url} attribution={GEO_BASEMAP.attribution} />
      <GeoJSON
        key={`${detail.areaCode}-${view}`}
        data={model.featureCollection}
        style={style}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties;
          layer.bindTooltip(
            `<strong>${escapeHtml(String(properties.meshId))}</strong><br>2020年 ${Number(properties.population2020).toLocaleString('ja-JP')}人<br>2050年 ${Number(properties.population2050).toLocaleString('ja-JP')}人<br>変化率 ${properties.changeRate === null ? '算出不可' : `${properties.changeRate}%`}<br>${properties.accessible ? '駅800m圏内' : '駅800m圏外'}`,
            { sticky: true }
          );
          const popup = document.createElement('span');
          popup.textContent = `メッシュ ${String(properties.meshId)}：2020年 ${Number(properties.population2020).toLocaleString('ja-JP')}人 → 2050年 ${Number(properties.population2050).toLocaleString('ja-JP')}人。${properties.accessible ? '中心点が駅800m圏内' : '中心点が駅800m圏外'}`;
          layer.bindPopup(popup);
        }}
      />
      {view === 'overlap'
        ? detail.stations.map(([id, name, longitudeE6, latitudeE6]) => (
            <CircleMarker
              key={id}
              center={[latitudeE6 / 1_000_000, longitudeE6 / 1_000_000]}
              radius={3.5}
              pathOptions={{
                color: '#0f172a',
                fillColor: '#f8fafc',
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              <Tooltip>{name}</Tooltip>
              <Popup>{name}（駅代表点。駅入口ではありません）</Popup>
            </CircleMarker>
          ))
        : null}
      <FitBounds bounds={model.bounds} />
    </MapContainer>
  );
}
