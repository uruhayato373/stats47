"use client";

import { useMemo } from "react";

import {
  TILE_PROVIDERS,
  JAPAN_CENTER,
  JAPAN_MIN_ZOOM,
  JAPAN_MAX_ZOOM,
} from "@stats47/visualization/leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";

import type { FishingPortData } from "../lib/load-fishing-port-data";

const TYPE_COLORS: Record<string, { light: string; dark: string }> = {
  "1": { light: "#3b82f6", dark: "#60a5fa" }, // 第1種: 青
  "2": { light: "#22c55e", dark: "#4ade80" }, // 第2種: 緑
  "3": { light: "#f59e0b", dark: "#fbbf24" }, // 第3種: 橙
  "4": { light: "#8b5cf6", dark: "#a78bfa" }, // 第4種: 紫
  "5": { light: "#ef4444", dark: "#f87171" }, // 特定第3種: 赤
};

interface Props {
  ports: FishingPortData[];
  selectedType: string | null;
  selectedPort: string | null;
  onSelectPort: (code: string | null) => void;
  isDark: boolean;
}

export default function FishingPortLeafletMap({
  ports,
  selectedType,
  selectedPort,
  onSelectPort,
  isDark,
}: Props) {
  const tile = isDark ? TILE_PROVIDERS.dark : TILE_PROVIDERS.light;

  const filteredPorts = useMemo(() => {
    if (!selectedType) return ports;
    return ports.filter((p) => p.portType === selectedType);
  }, [ports, selectedType]);

  return (
    <MapContainer
      center={JAPAN_CENTER}
      zoom={5}
      minZoom={JAPAN_MIN_ZOOM}
      maxZoom={JAPAN_MAX_ZOOM}
      className="h-[500px] w-full"
      scrollWheelZoom
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      {filteredPorts.map((port) => {
        const isSelected = port.portCode === selectedPort;
        const colors = TYPE_COLORS[port.portType] || TYPE_COLORS["1"];
        const fillColor = isSelected
          ? "#ec4899"
          : isDark
            ? colors.dark
            : colors.light;

        return (
          <CircleMarker
            key={port.portCode}
            center={[port.latitude, port.longitude]}
            radius={isSelected ? 7 : 4}
            pathOptions={{
              fillColor,
              fillOpacity: isSelected ? 0.9 : 0.7,
              color: isSelected
                ? "#db2777"
                : isDark
                  ? "#1e293b"
                  : "#ffffff",
              weight: isSelected ? 2 : 0.5,
            }}
            eventHandlers={{
              click: () => onSelectPort(port.portCode),
            }}
          >
            <Tooltip>
              <div className="text-xs">
                <div className="font-bold">{port.portName}漁港</div>
                <div className="text-muted-foreground">
                  {port.prefectureName} / {port.portTypeName}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
