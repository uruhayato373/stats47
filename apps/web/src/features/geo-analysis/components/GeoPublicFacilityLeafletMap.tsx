'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';

import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import { buildGeoPublicFacilityMapModel } from '../lib/build-geo-public-facility-map-model';
import { createGeoCanvasRenderer } from '../lib/create-geo-canvas-renderer';
import { GEO_BASEMAP } from '../lib/geo-basemap';
import {
  PUBLIC_FACILITY_BAND_COLORS,
  PUBLIC_FACILITY_BAND_LABELS,
  type PublicFacilityGroup,
} from '../lib/geo-public-facility-evidence';

import type { GeoPublicFacilityPrefDetail } from '@stats47/gis';
import type { Feature, Geometry } from 'geojson';
import type { LatLngBoundsExpression, PathOptions } from 'leaflet';

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16], maxZoom: 11 });
  }, [map, bounds]);
  return null;
}
const populationColor = (change: number | null) =>
  change === null
    ? '#94a3b8'
    : change >= 0
      ? '#0f766e'
      : change >= -15
        ? '#67a9cf'
        : change >= -30
          ? '#fdbb84'
          : '#b91c1c';

export function GeoPublicFacilityLeafletMap({
  detail,
  view,
  group,
}: {
  detail: GeoPublicFacilityPrefDetail;
  view: 'population' | 'facilities' | 'overlap';
  group: PublicFacilityGroup;
}) {
  const renderer = useState(() => createGeoCanvasRenderer())[0];
  const model = useMemo(
    () => buildGeoPublicFacilityMapModel(detail, group),
    [detail, group]
  );
  const points =
    view === 'facilities'
      ? model.sourceFacilities
      : view === 'overlap'
        ? model.nearestFacilities
        : [];
  const style = (
    feature?: Feature<Geometry, Record<string, unknown>>
  ): PathOptions => ({
    color: '#ffffff',
    weight: 0.35,
    fillOpacity: 0.72,
    fillColor:
      view === 'overlap'
        ? (PUBLIC_FACILITY_BAND_COLORS[Number(feature?.properties.band)] ??
          '#94a3b8')
        : populationColor(
            typeof feature?.properties.change === 'number'
              ? feature.properties.change
              : null
          ),
  });
  return (
    <MapContainer
      key={detail.areaCode}
      renderer={renderer}
      preferCanvas
      center={[36.5, 137.5]}
      zoom={6}
      zoomAnimation={false}
      minZoom={GEO_BASEMAP.minZoom}
      maxZoom={14}
      scrollWheelZoom={false}
      className="isolate h-[480px] overflow-hidden rounded-none lg:h-[620px]"
      aria-label={`${detail.areaName}の公共施設と人口メッシュ`}
    >
      <TileLayer url={GEO_BASEMAP.url} attribution={GEO_BASEMAP.attribution} />
      {view !== 'facilities' ? (
        <GeoJSON
          key={`${detail.areaCode}-${view}-${group}`}
          data={model.collection}
          style={style}
          onEachFeature={(feature, layer) => {
            const p = feature.properties;
            const text = `メッシュ ${p.id}：2020年 ${Number(p.population2020).toLocaleString('ja-JP')}人 → 2050年 ${Number(p.population2050).toLocaleString('ja-JP')}人。最寄り ${p.facilityName}${p.outsidePrefecture ? '（県外）' : ''}、${Number(p.distanceMeters).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}m（${PUBLIC_FACILITY_BAND_LABELS[Number(p.band)]}）。`;
            const tooltip = document.createElement('span');
            tooltip.textContent = text;
            const popup = document.createElement('span');
            popup.textContent = text;
            layer.bindTooltip(tooltip, { sticky: true });
            layer.bindPopup(popup);
          }}
        />
      ) : null}
      {points.map(([index, id, municipality, , name, longitude, latitude]) => (
        <CircleMarker
          key={index}
          center={[latitude, longitude]}
          radius={3.5}
          pathOptions={{
            color: '#0f172a',
            fillColor: '#f8fafc',
            fillOpacity: 1,
            weight: 1.5,
          }}
        >
          <Tooltip>{name}</Tooltip>
          <Popup>
            {name}（自治体コード {municipality}）。2022年4月の原典施設地点。{id}
          </Popup>
        </CircleMarker>
      ))}
      <FitBounds bounds={model.bounds} />
    </MapContainer>
  );
}
