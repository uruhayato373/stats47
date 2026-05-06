"use client";

import { useCallback, useEffect } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

export type KsjGeometryType = "point" | "line" | "polygon" | "mesh" | "mixed";

const BASE_STYLES: Record<KsjGeometryType, PathOptions> = {
  point:   { color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.8, weight: 1 },
  line:    { color: "#dc2626", weight: 2, opacity: 0.85 },
  polygon: { color: "#475569", weight: 1, fillColor: "#94a3b8", fillOpacity: 0.45 },
  mesh:    { color: "#78350f", weight: 0.5, fillColor: "#f59e0b", fillOpacity: 0.55 },
  mixed:   { color: "#475569", weight: 1, fillColor: "#94a3b8", fillOpacity: 0.45 },
};

const HOVER_STYLE: PathOptions = { weight: 2.5, fillOpacity: 0.85 };

function buildPopupHtml(props: Record<string, unknown> | null): string {
  if (!props) return "<em>プロパティなし</em>";
  const rows = Object.entries(props)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:1px 6px;color:#64748b;white-space:nowrap">${k}</td><td style="padding:1px 6px">${String(v)}</td></tr>`)
    .join("");
  return `<div style="max-height:260px;overflow-y:auto;font-size:12px"><table>${rows}</table></div>`;
}

interface KsjGeoJsonLayerProps {
  geojson: FeatureCollection<Geometry>;
  geometryType: KsjGeometryType;
  label?: string;
  color?: string;
  fitOnLoad?: boolean;
}

export function KsjGeoJsonLayer({
  geojson,
  geometryType,
  label,
  color,
  fitOnLoad = false,
}: KsjGeoJsonLayerProps) {
  const map = useMap();
  const base = BASE_STYLES[geometryType];
  const style: PathOptions = color
    ? { ...base, color, fillColor: color }
    : base;

  useEffect(() => {
    if (!fitOnLoad || geojson.features.length === 0) return;
    try {
      const layer = L.geoJSON(geojson as never);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
      }
    } catch {
      // bounds 計算失敗は無視（point データが 1 件など）
    }
  }, [map, geojson, fitOnLoad]);

  const pointToLayer = useCallback(
    (_: Feature<Geometry>, latlng: L.LatLng) =>
      L.circleMarker(latlng, { ...style, radius: 5 }),
    [style]
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry>, layer: Layer) => {
      const popupHtml = buildPopupHtml(feature.properties);
      layer.bindPopup(popupHtml, { maxWidth: 320, maxHeight: 300 });

      if (geometryType !== "point") {
        layer.on({
          mouseover: (e) => {
            (e.target as L.Path).setStyle(HOVER_STYLE);
            (e.target as L.Path).bringToFront();
          },
          mouseout: (e) => {
            (e.target as L.Path).setStyle(style);
          },
        });
      }
    },
    [geometryType, style]
  );

  return (
    <GeoJSON
      key={`${label ?? "layer"}-${color ?? "default"}`}
      data={geojson}
      style={geometryType !== "point" ? () => style : undefined}
      pointToLayer={geometryType === "point" ? pointToLayer : undefined}
      onEachFeature={onEachFeature}
    />
  );
}
