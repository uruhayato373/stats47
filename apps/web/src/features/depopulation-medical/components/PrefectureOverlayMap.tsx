"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";

import { TILE_OPTIONS_LIGHT } from "@stats47/visualization/leaflet/constants/tile-providers";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { DepopulationMedicalPrefDetail } from "../lib/types";
import type { GeoJsonObject } from "geojson";
import type { LatLngBoundsExpression } from "leaflet";



const COLOR_INSIDE = "#dc2626"; // 過疎地域内 = 赤
const COLOR_OUTSIDE = "#94a3b8"; // 過疎地域外 = 灰
const COLOR_AREA = "#f97316"; // 過疎ポリゴン = オレンジ

interface Props {
  detail: DepopulationMedicalPrefDetail;
}

/** マウント時に県の範囲へ fitBounds する */
function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, bounds]);
  return null;
}

/**
 * 県別の過疎地域(面) × 医療機関(点) 重ね合わせマップ。
 * 医療機関は過疎地域内=赤 / 外=灰 で色分け。25,000 点規模に備え preferCanvas。
 */
export function PrefectureOverlayMap({ detail }: Props) {
  const tile = TILE_OPTIONS_LIGHT[0];

  // facilities の lat/lon から fitBounds 用の範囲を算出
  const bounds: LatLngBoundsExpression | null = useMemo(() => {
    if (detail.facilities.length === 0) return null;
    let minLat = Infinity,
      minLon = Infinity,
      maxLat = -Infinity,
      maxLon = -Infinity;
    for (const f of detail.facilities) {
      if (f.lat < minLat) minLat = f.lat;
      if (f.lat > maxLat) maxLat = f.lat;
      if (f.lon < minLon) minLon = f.lon;
      if (f.lon > maxLon) maxLon = f.lon;
    }
    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }, [detail.facilities]);

  return (
    <MapContainer
      preferCanvas
      center={[36.5, 137.5]}
      zoom={6}
      minZoom={4}
      maxZoom={14}
      scrollWheelZoom
      className="h-[420px] lg:h-[520px] rounded-md overflow-hidden"
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />

      {/* 過疎地域ポリゴン */}
      <GeoJSON
        data={detail.depopulationAreas as unknown as GeoJsonObject}
        style={{
          color: COLOR_AREA,
          weight: 1,
          fillColor: COLOR_AREA,
          fillOpacity: 0.18,
        }}
      />

      {/* 医療機関 point (過疎内=赤 / 外=灰) */}
      {detail.facilities.map((f, i) => (
        <CircleMarker
          key={i}
          center={[f.lat, f.lon]}
          radius={3}
          pathOptions={{
            color: f.inDepopulationArea ? COLOR_INSIDE : COLOR_OUTSIDE,
            fillColor: f.inDepopulationArea ? COLOR_INSIDE : COLOR_OUTSIDE,
            fillOpacity: f.inDepopulationArea ? 0.9 : 0.5,
            weight: 1,
          }}
        />
      ))}

      <FitBounds bounds={bounds} />
    </MapContainer>
  );
}
