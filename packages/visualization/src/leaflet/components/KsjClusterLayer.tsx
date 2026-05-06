"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { FeatureCollection, Geometry, Point } from "geojson";

function buildPopupHtml(props: Record<string, unknown> | null): string {
  if (!props) return "<em>プロパティなし</em>";
  const rows = Object.entries(props)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:1px 6px;color:#64748b;white-space:nowrap">${k}</td><td style="padding:1px 6px">${String(v)}</td></tr>`
    )
    .join("");
  return `<div style="max-height:260px;overflow-y:auto;font-size:12px"><table>${rows}</table></div>`;
}

function makeClusterIcon(color: string, count: number): L.DivIcon {
  const size = count >= 1000 ? 42 : count >= 100 ? 36 : 30;
  return L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;border:2px solid rgba(255,255,255,0.85);box-shadow:0 1px 4px rgba(0,0,0,.25)">${count >= 10000 ? `${Math.round(count / 1000)}k` : count.toLocaleString()}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface KsjClusterLayerProps {
  geojson: FeatureCollection<Geometry>;
  color: string;
  label?: string;
  fitOnLoad?: boolean;
}

export function KsjClusterLayer({
  geojson,
  color,
  label,
  fitOnLoad = false,
}: KsjClusterLayerProps) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      maxClusterRadius: 60,
      iconCreateFunction: (c) => makeClusterIcon(color, c.getChildCount()),
      // Canvas renderer を引き継ぐ
      ...(map.options.preferCanvas ? { renderer: L.canvas() } : {}),
    });

    geojson.features.forEach((feature) => {
      if (feature.geometry.type !== "Point") return;
      const [lng, lat] = (feature.geometry as Point).coordinates;
      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1,
      });
      marker.bindPopup(
        buildPopupHtml(feature.properties as Record<string, unknown>),
        { maxWidth: 320, maxHeight: 300 }
      );
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    if (fitOnLoad && geojson.features.length > 0) {
      try {
        const bounds = cluster.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
        }
      } catch {
        // bounds 計算失敗は無視
      }
    }

    return () => {
      map.removeLayer(cluster);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geojson, color]);

  return null;
}
