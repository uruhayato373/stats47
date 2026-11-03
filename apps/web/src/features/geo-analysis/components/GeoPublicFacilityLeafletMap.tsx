'use client';
import { useMemo } from 'react';

import { CircleMarker, GeoJSON, Popup, Tooltip } from 'react-leaflet';

import { LeafletMapFrame } from '@/components/charts/LeafletMapFrame';

import { buildGeoPublicFacilityMapModel } from '../lib/build-geo-public-facility-map-model';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';
import {
  PUBLIC_FACILITY_BAND_COLORS,
  PUBLIC_FACILITY_BAND_LABELS,
  type PublicFacilityGroup,
} from '../lib/geo-public-facility-evidence';


import type { GeoPublicFacilityPrefDetail } from '@stats47/gis';
import type { Feature, Geometry } from 'geojson';
import type { PathOptions } from 'leaflet';

const populationColor = (change: number | null) =>
  change === null
    ? GEO_MAP_COLORS.populationChange.missing
    : change >= 0
      ? GEO_MAP_COLORS.populationChange.growing
      : change >= -15
        ? GEO_MAP_COLORS.populationChange.mildDecline
        : change >= -30
          ? GEO_MAP_COLORS.populationChange.moderateDecline
          : GEO_MAP_COLORS.populationChange.severeDecline;

export function GeoPublicFacilityLeafletMap({
  detail,
  view,
  group,
}: {
  detail: GeoPublicFacilityPrefDetail;
  view: 'population' | 'facilities' | 'overlap';
  group: PublicFacilityGroup;
}) {
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
    color: GEO_MAP_COLORS.outline,
    weight: 0.35,
    fillOpacity: 0.72,
    fillColor:
      view === 'overlap'
        ? (PUBLIC_FACILITY_BAND_COLORS[Number(feature?.properties.band)] ??
          GEO_MAP_COLORS.publicFacilityBandFallback)
        : populationColor(
            typeof feature?.properties.change === 'number'
              ? feature.properties.change
              : null
          ),
  });
  return (
    <LeafletMapFrame
      key={detail.areaCode}
      ariaLabel={`${detail.areaName}の公共施設と人口メッシュ`}
      bounds={model.bounds}
    >
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
            color: GEO_MAP_COLORS.pointMarker.stroke,
            fillColor: GEO_MAP_COLORS.pointMarker.fill,
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
    </LeafletMapFrame>
  );
}
