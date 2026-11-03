"use client";

import { useMemo } from "react";

import { CircleMarker, GeoJSON } from "react-leaflet";

import { LeafletMapFrame } from "@/components/charts/LeafletMapFrame";

import { LEAFLET_MAP_COLORS } from "@/features/map-visualization/client";

import type { DepopulationMedicalPrefDetail } from "../lib/types";
import type { GeoJsonObject } from "geojson";
import type { LatLngBoundsExpression } from "leaflet";

interface Props {
  detail: DepopulationMedicalPrefDetail;
}

/** 医療機関が 1 件も無い県で表示する範囲 (日本全体) */
const JAPAN_BOUNDS: LatLngBoundsExpression = [
  [24, 123],
  [46, 146],
];

/**
 * 県別の過疎地域(面) × 医療機関(点) 重ね合わせマップ。
 * 医療機関は過疎地域内=赤 / 外=灰 で色分け。25,000 点規模に備え preferCanvas。
 */
export function PrefectureOverlayMap({ detail }: Props) {
  const colors = LEAFLET_MAP_COLORS.depopulationMedical;

  // facilities の lat/lon から表示範囲を算出
  const bounds: LatLngBoundsExpression = useMemo(() => {
    if (detail.facilities.length === 0) return JAPAN_BOUNDS;
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
    <LeafletMapFrame ariaLabel={`${detail.prefName}の過疎地域と医療機関の地図`} bounds={bounds}>

      {/* 過疎地域ポリゴン */}
      <GeoJSON
        data={detail.depopulationAreas as unknown as GeoJsonObject}
        style={{
          color: colors.areaPolygon,
          weight: 1,
          fillColor: colors.areaPolygon,
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
            color: f.inDepopulationArea ? colors.insideArea : colors.outsideArea,
            fillColor: f.inDepopulationArea ? colors.insideArea : colors.outsideArea,
            fillOpacity: f.inDepopulationArea ? 0.9 : 0.5,
            weight: 1,
          }}
        />
      ))}
    </LeafletMapFrame>
  );
}
