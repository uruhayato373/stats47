"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  TileSwitcher,
  TILE_OPTIONS_LIGHT,
  TILE_OPTIONS_DARK,
  JAPAN_CENTER,
  JAPAN_MIN_ZOOM,
  JAPAN_MAX_ZOOM,
} from "@stats47/visualization/leaflet";
import type { TileProvider } from "@stats47/visualization/leaflet";
import type { PortWithStats } from "../lib/load-port-data";

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

const METRIC_LABELS: Record<MetricKey, { label: string; unit: string }> = {
  cargoTotal: { label: "貨物量", unit: "トン" },
  shipsTotal: { label: "入港隻数", unit: "隻" },
  passengersTotal: { label: "旅客数", unit: "人" },
  containerTonnage: { label: "コンテナ", unit: "トン" },
};

function formatShort(n: number | null): string {
  if (n === null) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`;
  return n.toLocaleString();
}

interface Props {
  ports: PortWithStats[];
  metric: MetricKey;
  selectedPort: string | null;
  onSelectPort: (code: string | null) => void;
  isDark: boolean;
}

export default function PortLeafletMap({
  ports,
  metric,
  selectedPort,
  onSelectPort,
  isDark,
}: Props) {
  const tileOptions = isDark ? TILE_OPTIONS_DARK : TILE_OPTIONS_LIGHT;
  const [currentTile, setCurrentTile] = useState<TileProvider>(tileOptions[0]);
  useEffect(() => { setCurrentTile(tileOptions[0]); }, [isDark]);
  const metricInfo = METRIC_LABELS[metric];

  const { getRadius, getColor } = useMemo(() => {
    const values = ports
      .map((p) => p[metric])
      .filter((v): v is number => v !== null && v > 0);
    const max = Math.max(...values, 1);

    return {
      getRadius: (val: number | null) => {
        if (val === null || val <= 0) return 3;
        return 3 + Math.sqrt(val / max) * 27;
      },
      getColor: (val: number | null) => {
        if (val === null || val <= 0) return isDark ? "#475569" : "#94a3b8";
        const ratio = Math.sqrt(val / max);
        if (ratio < 0.33) return isDark ? "#3b82f6" : "#2563eb";
        if (ratio < 0.66) return isDark ? "#f59e0b" : "#d97706";
        return isDark ? "#ef4444" : "#dc2626";
      },
    };
  }, [ports, metric, isDark]);

  return (
    <div className="relative">
      <MapContainer
        key={currentTile.url}
        center={JAPAN_CENTER}
        zoom={5}
        minZoom={JAPAN_MIN_ZOOM}
        maxZoom={currentTile.maxZoom ?? JAPAN_MAX_ZOOM}
        className="h-[500px] w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          url={currentTile.url}
          attribution={currentTile.attribution}
          maxZoom={currentTile.maxZoom}
        />
        {ports.map((port) => {
          if (!port.latitude || !port.longitude) return null;
          const val = port[metric];
          const isSelected = port.portCode === selectedPort;

          return (
            <CircleMarker
              key={port.portCode}
              center={[port.latitude, port.longitude]}
              radius={getRadius(val)}
              pathOptions={{
                fillColor: isSelected ? "#8b5cf6" : getColor(val),
                fillOpacity: isSelected ? 0.9 : 0.7,
                color: isSelected ? "#7c3aed" : isDark ? "#1e293b" : "#ffffff",
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{
                click: () => onSelectPort(port.portCode),
              }}
            >
              <Tooltip>
                <div className="text-xs">
                  <div className="font-bold">
                    {port.prefectureName} {port.portName}港
                  </div>
                  {port.portGrade && (
                    <div className="text-muted-foreground">{port.portGrade}</div>
                  )}
                  <div>
                    {metricInfo.label}: {formatShort(val)} {metricInfo.unit}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <TileSwitcher onTileChange={setCurrentTile} isDark={isDark} />
    </div>
  );
}
