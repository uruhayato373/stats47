---
title: Leaflet 統合実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
  - leaflet
  - geoshape
  - choropleth
---

# Leaflet 統合実装ガイド

## 概要

stats47 プロジェクトにおける Leaflet 地図ライブラリの統合実装ガイドです。Geoshape データセットを活用したコロプレス地図、マーカー表示、ヒートマップなどの地図可視化機能を実装します。

## 技術スタック

### 必須ライブラリ

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "topojson-client": "^3.1.0",
    "d3-scale": "^4.0.2",
    "d3-scale-chromatic": "^3.0.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

### CSS の設定

```css
/* globals.css に追加 */
@import "leaflet/dist/leaflet.css";

/* Leaflet マップのスタイル */
.leaflet-container {
  height: 100%;
  width: 100%;
  z-index: 1;
}

/* カスタムマーカーのスタイル */
.custom-marker {
  background-color: #3b82f6;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ポップアップのスタイル */
.leaflet-popup-content {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

/* コロプレス地図のスタイル */
.choropleth-layer {
  stroke: #ffffff;
  stroke-width: 1;
  stroke-opacity: 0.8;
}
```

## 基本地図コンポーネント

### LeafletMap コンポーネント

```typescript
// src/components/leaflet/LeafletMap.tsx
import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLngTuple } from "leaflet";
import { MapConfig, GeographicData } from "@/types/leaflet";

interface LeafletMapProps {
  config: MapConfig;
  data: GeographicData;
  onMapReady?: (map: L.Map) => void;
  onFeatureClick?: (feature: GeoJSONFeature) => void;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  config,
  data,
  onMapReady,
  onFeatureClick,
  className = "h-96 w-full",
}) => {
  const mapRef = useRef<L.Map>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  const handleLayerToggle = (layerId: string) => {
    // レイヤー表示/非表示ロジック
    console.log(`Toggle layer: ${layerId}`);
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={config.center}
        zoom={config.zoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        whenCreated={setMap}
      >
        <BaseMapLayer config={config.baseMap} />
        <DataLayers layers={data.layers} onFeatureClick={onFeatureClick} />
        <MapControls layers={data.layers} onLayerToggle={handleLayerToggle} />
      </MapContainer>
    </div>
  );
};

// 地図の初期化を管理するコンポーネント
const MapInitializer: React.FC<{ onMapReady: (map: L.Map) => void }> = ({
  onMapReady,
}) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
};
```

### 型定義

```typescript
// src/types/leaflet.ts
import { Feature, FeatureCollection, Geometry } from "geojson";

export interface MapConfig {
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  baseMap: BaseMapConfig;
  controls?: MapControlsConfig;
}

export interface BaseMapConfig {
  type: "osm" | "cartodb" | "esri" | "custom";
  url?: string;
  attribution?: string;
  opacity?: number;
}

export interface GeographicData {
  type: "geographic";
  features: GeoJSONFeature[];
  bounds: GeographicBounds;
  baseMap: BaseMapConfig;
  layers: MapLayer[];
}

export interface GeoJSONFeature extends Feature {
  properties: {
    id: string;
    name: string;
    areaCode: string;
    level: "prefecture" | "municipality";
    value?: number;
    category?: string;
    [key: string]: any;
  };
}

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: "choropleth" | "markers" | "heatmap" | "lines";
  visible: boolean;
  opacity: number;
  data: FeatureCollection;
  style?: LayerStyle;
}

export interface LayerStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

export interface MapControlsConfig {
  showZoom?: boolean;
  showScale?: boolean;
  showAttribution?: boolean;
  showLayerControl?: boolean;
}
```

## コロプレス地図の実装

### ChoroplethLayer コンポーネント

```typescript
// src/components/leaflet/ChoroplethLayer.tsx
import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import { FeatureCollection } from "geojson";
import * as d3 from "d3-scale";
import * as d3Chromatic from "d3-scale-chromatic";

interface ChoroplethLayerProps {
  data: FeatureCollection;
  valueField: string;
  colorScheme: string;
  scaleType: "linear" | "log" | "quantile" | "quantize";
  onFeatureClick?: (feature: any) => void;
  onFeatureHover?: (feature: any) => void;
}

export const ChoroplethLayer: React.FC<ChoroplethLayerProps> = ({
  data,
  valueField,
  colorScheme,
  scaleType,
  onFeatureClick,
  onFeatureHover,
}) => {
  // カラースケールの生成
  const colorScale = useMemo(() => {
    const values = data.features
      .map((f) => f.properties?.[valueField])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => Number(v));

    if (values.length === 0) {
      return () => "#cccccc";
    }

    const [min, max] = d3.extent(values) as [number, number];
    const colorSchemeFn = d3Chromatic[
      colorScheme as keyof typeof d3Chromatic
    ] as readonly string[];

    switch (scaleType) {
      case "linear":
        return d3
          .scaleLinear<string>()
          .domain([min, max])
          .range(colorSchemeFn as any);

      case "log":
        return d3
          .scaleLog<string>()
          .domain([min, max])
          .range(colorSchemeFn as any);

      case "quantile":
        return d3
          .scaleQuantile<string>()
          .domain(values)
          .range(colorSchemeFn as any);

      case "quantize":
        return d3
          .scaleQuantize<string>()
          .domain([min, max])
          .range(colorSchemeFn as any);

      default:
        return d3
          .scaleLinear<string>()
          .domain([min, max])
          .range(colorSchemeFn as any);
    }
  }, [data, valueField, colorScheme, scaleType]);

  // スタイル関数
  const style = useMemo(() => {
    return (feature: any) => {
      const value = feature.properties?.[valueField];
      const color =
        value !== null && value !== undefined
          ? colorScale(Number(value))
          : "#cccccc";

      return {
        fillColor: color,
        fillOpacity: 0.7,
        stroke: "#ffffff",
        strokeWidth: 1,
        strokeOpacity: 0.8,
      };
    };
  }, [colorScale, valueField]);

  // イベントハンドラー
  const handleEachFeature = (feature: any, layer: L.Layer) => {
    // クリックイベント
    layer.on("click", () => {
      if (onFeatureClick) {
        onFeatureClick(feature);
      }
    });

    // ホバーイベント
    layer.on("mouseover", (e) => {
      const layer = e.target;
      layer.setStyle({
        fillOpacity: 0.9,
        strokeWidth: 2,
      });

      if (onFeatureHover) {
        onFeatureHover(feature);
      }
    });

    layer.on("mouseout", (e) => {
      const layer = e.target;
      layer.setStyle({
        fillOpacity: 0.7,
        strokeWidth: 1,
      });
    });
  };

  return (
    <GeoJSON data={data} style={style} onEachFeature={handleEachFeature} />
  );
};
```

### コロプレス地図の統合

```typescript
// src/components/leaflet/ChoroplethMap.tsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { ChoroplethLayer } from "./ChoroplethLayer";
import { GeoshapeDataService } from "@/infrastructure/geoshape";
import { TopoJSONConverter } from "@/infrastructure/topojson";

interface ChoroplethMapProps {
  areaLevel: "prefecture" | "municipality";
  prefectureCode?: string;
  data: Array<{
    areaCode: string;
    value: number;
    name: string;
  }>;
  colorScheme?: string;
  scaleType?: "linear" | "log" | "quantile" | "quantize";
  onFeatureClick?: (feature: any) => void;
}

export const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  areaLevel,
  prefectureCode,
  data,
  colorScheme = "interpolateBlues",
  scaleType = "linear",
  onFeatureClick,
}) => {
  const [geoJSON, setGeoJSON] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TopoJSON データの取得
        let topoJSON;
        if (areaLevel === "prefecture") {
          topoJSON = await GeoshapeDataService.getPrefectureData();
        } else {
          if (!prefectureCode) {
            throw new Error(
              "Prefecture code is required for municipality data"
            );
          }
          topoJSON = await GeoshapeDataService.getMunicipalityData(
            prefectureCode
          );
        }

        // GeoJSON への変換
        const objectName =
          areaLevel === "prefecture" ? "jp_pref" : `${prefectureCode}_city`;
        const convertedGeoJSON = TopoJSONConverter.convertToGeoJSON(
          topoJSON,
          objectName
        );

        // 統計データとの結合
        const enrichedGeoJSON = enrichWithStatistics(convertedGeoJSON, data);

        setGeoJSON(enrichedGeoJSON);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [areaLevel, prefectureCode, data]);

  // 統計データとの結合
  const enrichWithStatistics = (
    geoJSON: FeatureCollection,
    statistics: any[]
  ) => {
    const statsMap = new Map(statistics.map((s) => [s.areaCode, s]));

    return {
      ...geoJSON,
      features: geoJSON.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          ...statsMap.get(feature.properties.areaCode),
        },
      })),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">地図データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  if (!geoJSON) {
    return null;
  }

  return (
    <div className="h-96 w-full">
      <MapContainer
        center={[35.6762, 139.6503]} // 東京
        zoom={areaLevel === "prefecture" ? 6 : 8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ChoroplethLayer
          data={geoJSON}
          valueField="value"
          colorScheme={colorScheme}
          scaleType={scaleType}
          onFeatureClick={onFeatureClick}
        />
      </MapContainer>
    </div>
  );
};
```

## マーカー地図の実装

### MarkerLayer コンポーネント

```typescript
// src/components/leaflet/MarkerLayer.tsx
import React from "react";
import { Marker, Popup } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";

interface MarkerData {
  id: string;
  name: string;
  coordinates: [number, number];
  value?: number;
  category?: string;
  properties?: Record<string, any>;
}

interface MarkerLayerProps {
  data: MarkerData[];
  markerType: "circle" | "pin" | "custom";
  sizeField?: string;
  colorField?: string;
  onMarkerClick?: (marker: MarkerData) => void;
  popupContent?: (marker: MarkerData) => React.ReactNode;
}

export const MarkerLayer: React.FC<MarkerLayerProps> = ({
  data,
  markerType,
  sizeField,
  colorField,
  onMarkerClick,
  popupContent,
}) => {
  // マーカーサイズの計算
  const getMarkerSize = (marker: MarkerData): number => {
    if (!sizeField || !marker[sizeField as keyof MarkerData]) {
      return 10;
    }

    const value = Number(marker[sizeField as keyof MarkerData]);
    return Math.max(5, Math.min(30, value / 10));
  };

  // マーカーカラーの計算
  const getMarkerColor = (marker: MarkerData): string => {
    if (!colorField || !marker[colorField as keyof MarkerData]) {
      return "#3b82f6";
    }

    const value = marker[colorField as keyof MarkerData];
    return typeof value === "string" ? value : "#3b82f6";
  };

  // カスタムアイコンの生成
  const createCustomIcon = (marker: MarkerData): DivIcon => {
    const size = getMarkerSize(marker);
    const color = getMarkerColor(marker);

    return new DivIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        "></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // ピンアイコンの生成
  const createPinIcon = (marker: MarkerData): Icon => {
    const color = getMarkerColor(marker);

    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
  };

  return (
    <>
      {data.map((marker) => {
        let icon: Icon | DivIcon;

        switch (markerType) {
          case "circle":
            icon = createCustomIcon(marker);
            break;
          case "pin":
            icon = createPinIcon(marker);
            break;
          default:
            icon = createCustomIcon(marker);
        }

        return (
          <Marker
            key={marker.id}
            position={marker.coordinates}
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            {popupContent && <Popup>{popupContent(marker)}</Popup>}
          </Marker>
        );
      })}
    </>
  );
};
```

## ヒートマップの実装

### HeatmapLayer コンポーネント

```typescript
// src/components/leaflet/HeatmapLayer.tsx
import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HeatmapLayer as LeafletHeatmapLayer } from "leaflet.heat";

interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapLayerProps {
  data: HeatmapData[];
  radius?: number;
  maxZoom?: number;
  intensityScale?: number;
  gradient?: Record<number, string>;
  opacity?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  data,
  radius = 25,
  maxZoom = 18,
  intensityScale = 1,
  gradient,
  opacity = 0.6,
}) => {
  const map = useMap();
  const heatmapRef = useRef<LeafletHeatmapLayer | null>(null);

  useEffect(() => {
    // 既存のヒートマップレイヤーを削除
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
    }

    // ヒートマップデータの準備
    const heatmapData = data.map((point) => [
      point.lat,
      point.lng,
      point.intensity * intensityScale,
    ]);

    // ヒートマップレイヤーの作成
    const heatmapLayer = new LeafletHeatmapLayer(heatmapData, {
      radius,
      maxZoom,
      gradient,
      opacity,
    });

    // マップに追加
    heatmapLayer.addTo(map);
    heatmapRef.current = heatmapLayer;

    // クリーンアップ
    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [map, data, radius, maxZoom, intensityScale, gradient, opacity]);

  return null;
};
```

## 地図コントロールの実装

### MapControls コンポーネント

```typescript
// src/components/leaflet/MapControls.tsx
import React, { useState } from "react";
import { useMap } from "react-leaflet";
import { MapLayer } from "@/types/leaflet";

interface MapControlsProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string) => void;
  onZoomToBounds?: () => void;
  onResetView?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layers,
  onLayerToggle,
  onZoomToBounds,
  onResetView,
}) => {
  const map = useMap();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleZoomToBounds = () => {
    if (onZoomToBounds) {
      onZoomToBounds();
    } else {
      // デフォルトの境界にズーム
      map.fitBounds([
        [24.0, 129.0], // 南西
        [45.5, 146.0], // 北東
      ]);
    }
  };

  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    } else {
      map.setView([35.6762, 139.6503], 6); // 東京中心
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900"
      >
        <span>地図コントロール</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* レイヤーコントロール */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">レイヤー</h3>
            <div className="space-y-2">
              {layers.map((layer) => (
                <label key={layer.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => onLayerToggle(layer.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {layer.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ズームコントロール */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">ズーム</h3>
            <div className="space-y-2">
              <button
                onClick={handleZoomToBounds}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                全体表示
              </button>
              <button
                onClick={handleResetView}
                className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                リセット
              </button>
            </div>
          </div>

          {/* ズームレベル表示 */}
          <div className="text-xs text-gray-500">
            ズームレベル: {map.getZoom()}
          </div>
        </div>
      )}
    </div>
  );
};
```

## レスポンシブデザイン対応

### ResponsiveMap コンポーネント

```typescript
// src/components/leaflet/ResponsiveMap.tsx
import React, { useState, useEffect } from "react";
import { MapContainer } from "react-leaflet";

interface ResponsiveMapProps {
  children: React.ReactNode;
  className?: string;
  height?: string | number;
}

export const ResponsiveMap: React.FC<ResponsiveMapProps> = ({
  children,
  className = "h-96 w-full",
  height,
}) => {
  const [mapHeight, setMapHeight] = useState<string | number>(
    height || "400px"
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (!height) {
        setMapHeight(window.innerWidth < 768 ? "300px" : "400px");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [height]);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[35.6762, 139.6503]}
        zoom={isMobile ? 5 : 6}
        style={{
          height: mapHeight,
          width: "100%",
          minHeight: "200px",
        }}
        zoomControl={!isMobile}
        dragging={!isMobile}
        touchZoom={isMobile}
        doubleClickZoom={!isMobile}
        scrollWheelZoom={!isMobile}
      >
        {children}
      </MapContainer>
    </div>
  );
};
```

## パフォーマンス最適化

### データの遅延読み込み

```typescript
// src/hooks/useGeographicData.ts
import { useState, useEffect } from "react";
import { GeoshapeDataService } from "@/infrastructure/geoshape";
import { TopoJSONConverter } from "@/infrastructure/topojson";

export const useGeographicData = (
  areaLevel: "prefecture" | "municipality",
  prefectureCode?: string
) => {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let topoJSON;
        if (areaLevel === "prefecture") {
          topoJSON = await GeoshapeDataService.getPrefectureData();
        } else {
          if (!prefectureCode) {
            throw new Error(
              "Prefecture code is required for municipality data"
            );
          }
          topoJSON = await GeoshapeDataService.getMunicipalityData(
            prefectureCode
          );
        }

        const objectName =
          areaLevel === "prefecture" ? "jp_pref" : `${prefectureCode}_city`;
        const geoJSON = TopoJSONConverter.convertToGeoJSON(
          topoJSON,
          objectName
        );

        setData(geoJSON);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [areaLevel, prefectureCode]);

  return { data, loading, error };
};
```

### メモ化による最適化

```typescript
// src/components/leaflet/OptimizedChoroplethMap.tsx
import React, { memo, useMemo } from "react";
import { ChoroplethLayer } from "./ChoroplethLayer";

interface OptimizedChoroplethMapProps {
  data: FeatureCollection;
  valueField: string;
  colorScheme: string;
  scaleType: "linear" | "log" | "quantile" | "quantize";
  onFeatureClick?: (feature: any) => void;
}

export const OptimizedChoroplethMap = memo<OptimizedChoroplethMapProps>(
  ({ data, valueField, colorScheme, scaleType, onFeatureClick }) => {
    // カラースケールのメモ化
    const colorScale = useMemo(() => {
      // カラースケール生成ロジック
      return generateColorScale(data, valueField, colorScheme, scaleType);
    }, [data, valueField, colorScheme, scaleType]);

    // スタイル関数のメモ化
    const style = useMemo(() => {
      return (feature: any) => {
        const value = feature.properties?.[valueField];
        const color =
          value !== null && value !== undefined
            ? colorScale(Number(value))
            : "#cccccc";

        return {
          fillColor: color,
          fillOpacity: 0.7,
          stroke: "#ffffff",
          strokeWidth: 1,
          strokeOpacity: 0.8,
        };
      };
    }, [colorScale, valueField]);

    return (
      <ChoroplethLayer
        data={data}
        valueField={valueField}
        colorScheme={colorScheme}
        scaleType={scaleType}
        onFeatureClick={onFeatureClick}
      />
    );
  }
);

OptimizedChoroplethMap.displayName = "OptimizedChoroplethMap";
```

## まとめ

この Leaflet 統合実装ガイドにより、以下の機能が実現されます：

1. **基本地図機能**: タイルレイヤー、ズーム、パン操作
2. **コロプレス地図**: 統計データの可視化
3. **マーカー表示**: ポイントデータの表示
4. **ヒートマップ**: 密度データの可視化
5. **レスポンシブデザイン**: モバイル対応
6. **パフォーマンス最適化**: 遅延読み込み、メモ化
7. **カスタマイズ**: スタイル、コントロールの柔軟な設定

このガイドに従って、高機能で使いやすい地図可視化システムを構築できます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
