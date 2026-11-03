'use client';

import { useMemo } from 'react';

import { CircleMarker, GeoJSON, Popup, Tooltip } from 'react-leaflet';

import { LeafletMapFrame } from '@/components/charts/LeafletMapFrame';

import { buildGeoStationAccessMapModel } from '../lib/build-geo-station-access-map-model';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';

import type { GeoStationAccessView } from '../lib/geo-station-access-evidence';
import type { GeoStationAccessPrefDetail } from '@stats47/gis';
import type { Feature, Geometry } from 'geojson';
import type { PathOptions } from 'leaflet';

interface Props {
  detail: GeoStationAccessPrefDetail;
  view: Exclude<GeoStationAccessView, 'audit'>;
}

function populationColor(changeRate: number | null): string {
  if (changeRate === null) return GEO_MAP_COLORS.populationChange.missing;
  if (changeRate >= 0) return GEO_MAP_COLORS.populationChange.growing;
  if (changeRate >= -15) return GEO_MAP_COLORS.populationChange.mildDecline;
  if (changeRate >= -30) return GEO_MAP_COLORS.populationChange.moderateDecline;
  return GEO_MAP_COLORS.populationChange.severeDecline;
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
          ? GEO_MAP_COLORS.stationAccess.accessible
          : GEO_MAP_COLORS.stationAccess.outside
        : populationColor(
            typeof properties?.changeRate === 'number'
              ? properties.changeRate
              : null
          );
    return {
      color: GEO_MAP_COLORS.outline,
      weight: 0.35,
      fillColor,
      fillOpacity: view === 'overlap' ? (accessible ? 0.78 : 0.28) : 0.72,
    };
  };

  return (
    <LeafletMapFrame
      key={detail.areaCode}
      ariaLabel={`${detail.areaName}の1kmメッシュ分析地図`}
      bounds={model.bounds}
    >
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
                color: GEO_MAP_COLORS.pointMarker.stroke,
                fillColor: GEO_MAP_COLORS.pointMarker.fill,
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              <Tooltip>{name}</Tooltip>
              <Popup>{name}（駅代表点。駅入口ではありません）</Popup>
            </CircleMarker>
          ))
        : null}
    </LeafletMapFrame>
  );
}
