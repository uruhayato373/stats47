"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer } from "react-leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import {
  JAPAN_CENTER,
  JAPAN_ZOOM,
  JAPAN_MIN_ZOOM,
  JAPAN_MAX_ZOOM,
  TILE_PROVIDERS,
} from "../constants/tile-providers";
import { KsjGeoJsonLayer, type KsjGeometryType } from "./KsjGeoJsonLayer";
import { KsjClusterLayer } from "./KsjClusterLayer";

export interface KsjLayer {
  geojson: FeatureCollection<Geometry>;
  label: string;
  color?: string;
}

export interface KsjLeafletMapProps {
  layers: KsjLayer[];
  geometryType: KsjGeometryType;
  className?: string;
}

/**
 * KSJ データ汎用ビューア Leaflet マップ
 *
 * 1 件以上の GeoJSON レイヤーを受け取り、ジオメトリ型に応じたスタイルで描画する。
 * 最初のレイヤーロード時に fitBounds を実行して表示範囲を自動調整する。
 */
export function KsjLeafletMap({ layers, geometryType, className }: KsjLeafletMapProps) {
  const tile = TILE_PROVIDERS.light;

  return (
    <MapContainer
      center={JAPAN_CENTER}
      zoom={JAPAN_ZOOM}
      minZoom={JAPAN_MIN_ZOOM}
      maxZoom={JAPAN_MAX_ZOOM}
      preferCanvas={true}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      {layers.map((layer, i) =>
        geometryType === "point" ? (
          <KsjClusterLayer
            key={layer.label}
            geojson={layer.geojson}
            color={layer.color ?? "#1d4ed8"}
            label={layer.label}
            fitOnLoad={i === 0}
          />
        ) : (
          <KsjGeoJsonLayer
            key={layer.label}
            geojson={layer.geojson}
            geometryType={geometryType}
            label={layer.label}
            color={layer.color}
            fitOnLoad={i === 0}
          />
        )
      )}
    </MapContainer>
  );
}
