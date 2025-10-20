---
title: Leafletコンポーネント実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
  - leaflet
  - react-components
  - mapping
---

# Leaflet コンポーネント実装ガイド

## 概要

stats47 プロジェクトで Leaflet を使用した地図コンポーネントの実装ガイドです。React + TypeScript 環境で、再利用可能で保守性の高い地図コンポーネントを作成するためのベストプラクティスを提供します。

## 前提条件

### 必要なパッケージ

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet.markercluster": "^1.5.3",
    "leaflet.heat": "^0.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

### CSS 設定

```css
/* globals.css に追加 */
@import "leaflet/dist/leaflet.css";
@import "leaflet.markercluster/dist/MarkerCluster.css";
@import "leaflet.markercluster/dist/MarkerCluster.Default.css";
```

## 基本的な地図コンポーネント

### 1. メイン地図コンポーネント

```typescript
// src/components/leaflet/LeafletMap.tsx
import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLngTuple } from "leaflet";
import { MapConfig, GeographicData } from "@/types/leaflet";

interface LeafletMapProps {
  data: GeographicData;
  config: MapConfig;
  onMapReady?: (map: L.Map) => void;
  onFeatureClick?: (feature: any) => void;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  data,
  config,
  onMapReady,
  onFeatureClick,
  className = "h-96 w-full",
}) => {
  const mapRef = useRef<L.Map>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // 地図の初期化
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // データが変更されたときの地図の更新
  useEffect(() => {
    if (map && data.bounds) {
      const bounds = new LatLngBounds(
        [data.bounds.south, data.bounds.west],
        [data.bounds.north, data.bounds.east]
      );
      map.fitBounds(bounds);
    }
  }, [map, data.bounds]);

  return (
    <div className={className}>
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

// 地図の更新を管理する内部コンポーネント
const MapUpdater: React.FC<{ data: GeographicData }> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (data.bounds) {
      const bounds = new LatLngBounds(
        [data.bounds.south, data.bounds.west],
        [data.bounds.north, data.bounds.east]
      );
      map.fitBounds(bounds);
    }
  }, [map, data.bounds]);

  return null;
};
```

### 2. 基盤地図レイヤー

```typescript
// src/components/leaflet/BaseMapLayer.tsx
import React from "react";
import { TileLayer } from "react-leaflet";
import { BaseMapConfig } from "@/types/leaflet";

interface BaseMapLayerProps {
  config: BaseMapConfig;
}

export const BaseMapLayer: React.FC<BaseMapLayerProps> = ({ config }) => {
  return (
    <TileLayer
      url={config.tileUrl}
      attribution={config.attribution}
      maxZoom={config.maxZoom || 18}
      minZoom={config.minZoom || 1}
    />
  );
};
```

### 3. データレイヤー群

```typescript
// src/components/leaflet/DataLayers.tsx
import React from "react";
import { MapLayer } from "@/types/leaflet";
import { MarkerLayer } from "./layers/MarkerLayer";
import { HeatmapLayer } from "./layers/HeatmapLayer";
import { ChoroplethLayer } from "./layers/ChoroplethLayer";

interface DataLayersProps {
  layers: MapLayer[];
  onFeatureClick?: (feature: any) => void;
}

export const DataLayers: React.FC<DataLayersProps> = ({
  layers,
  onFeatureClick,
}) => {
  return (
    <>
      {layers.map((layer) => {
        switch (layer.type) {
          case "marker":
            return (
              <MarkerLayer
                key={layer.id}
                features={layer.data}
                style={layer.style}
                onFeatureClick={onFeatureClick}
              />
            );
          case "heatmap":
            return (
              <HeatmapLayer
                key={layer.id}
                features={layer.data}
                style={layer.style}
              />
            );
          case "choropleth":
            return (
              <ChoroplethLayer
                key={layer.id}
                features={layer.data}
                style={layer.style}
                onFeatureClick={onFeatureClick}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};
```

## レイヤー別コンポーネント

### 1. マーカーレイヤー

```typescript
// src/components/leaflet/layers/MarkerLayer.tsx
import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import { GeoJSONFeature, LayerStyle } from "@/types/leaflet";
import { createCustomIcon } from "@/lib/leaflet/icons";

interface MarkerLayerProps {
  features: GeoJSONFeature[];
  style?: LayerStyle;
  onFeatureClick?: (feature: GeoJSONFeature) => void;
}

export const MarkerLayer: React.FC<MarkerLayerProps> = ({
  features,
  style,
  onFeatureClick,
}) => {
  const icon = useMemo(
    () => createCustomIcon(style?.icon || { type: "default" }),
    [style?.icon]
  );

  return (
    <>
      {features.map((feature) => {
        if (feature.geometry.type !== "Point") return null;

        const [lng, lat] = feature.geometry.coordinates;

        return (
          <Marker
            key={feature.properties.id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => onFeatureClick?.(feature),
            }}
          >
            <Popup>
              <FeaturePopup feature={feature} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// フィーチャーポップアップコンポーネント
const FeaturePopup: React.FC<{ feature: GeoJSONFeature }> = ({ feature }) => {
  const { name, value, category, metadata } = feature.properties;

  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-bold text-lg mb-2">{name}</h3>
      {value !== undefined && (
        <p className="text-sm text-gray-600 mb-1">
          値: {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
      {category && (
        <p className="text-sm text-gray-600 mb-1">カテゴリ: {category}</p>
      )}
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="mt-2">
          <h4 className="font-semibold text-sm mb-1">詳細情報</h4>
          <div className="text-xs space-y-1">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. ヒートマップレイヤー

```typescript
// src/components/leaflet/layers/HeatmapLayer.tsx
import React, { useMemo } from "react";
import { useMap } from "react-leaflet";
import { GeoJSONFeature, LayerStyle } from "@/types/leaflet";

interface HeatmapLayerProps {
  features: GeoJSONFeature[];
  style?: LayerStyle;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  features,
  style,
}) => {
  const map = useMap();

  const heatmapData = useMemo(
    () =>
      features
        .filter((feature) => feature.geometry.type === "Point")
        .map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const value = feature.properties.value || 1;
          return [lat, lng, value] as [number, number, number];
        }),
    [features]
  );

  // ヒートマップレイヤーの実装
  // 実際の実装では、leaflet.heatプラグインを使用
  React.useEffect(() => {
    if (heatmapData.length === 0) return;

    // ヒートマップレイヤーの作成と追加
    const heatmapLayer = L.heatLayer(heatmapData, {
      radius: style?.radius || 20,
      opacity: style?.opacity || 0.6,
      gradient: {
        0.4: "blue",
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red",
      },
    });

    heatmapLayer.addTo(map);

    return () => {
      map.removeLayer(heatmapLayer);
    };
  }, [map, heatmapData, style]);

  return null;
};
```

### 3. コロプレスレイヤー

```typescript
// src/components/leaflet/layers/ChoroplethLayer.tsx
import React, { useMemo } from "react";
import { GeoJSON, GeoJSONProps } from "react-leaflet";
import { GeoJSONFeature, LayerStyle } from "@/types/leaflet";
import { createColorScale } from "@/lib/leaflet/colorScales";

interface ChoroplethLayerProps {
  features: GeoJSONFeature[];
  style?: LayerStyle;
  onFeatureClick?: (feature: GeoJSONFeature) => void;
}

export const ChoroplethLayer: React.FC<ChoroplethLayerProps> = ({
  features,
  style,
  onFeatureClick,
}) => {
  const colorScale = useMemo(() => {
    const values = features
      .map((f) => f.properties.value)
      .filter((v) => typeof v === "number") as number[];

    return createColorScale(values, {
      scheme: "blues",
      domain: [Math.min(...values), Math.max(...values)],
    });
  }, [features]);

  const geoJSONData = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features,
    }),
    [features]
  );

  const styleFunction: GeoJSONProps["style"] = (feature) => {
    const value = feature?.properties?.value;
    const color = typeof value === "number" ? colorScale(value) : "#cccccc";

    return {
      fillColor: color,
      weight: style?.weight || 2,
      opacity: style?.opacity || 1,
      color: "white",
      dashArray: "3",
      fillOpacity: style?.fillOpacity || 0.7,
    };
  };

  const onEachFeature: GeoJSONProps["onEachFeature"] = (feature, layer) => {
    layer.on({
      click: () => onFeatureClick?.(feature as GeoJSONFeature),
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "#666",
          dashArray: "",
          fillOpacity: 0.9,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: style?.weight || 2,
          color: "white",
          dashArray: "3",
          fillOpacity: style?.fillOpacity || 0.7,
        });
      },
    });
  };

  return (
    <GeoJSON
      data={geoJSONData}
      style={styleFunction}
      onEachFeature={onEachFeature}
    />
  );
};
```

## カスタムマーカー・ポップアップ

### 1. アイコン作成ユーティリティ

```typescript
// src/lib/leaflet/icons.ts
import L from "leaflet";
import { IconConfig } from "@/types/leaflet";

export const createCustomIcon = (config: IconConfig): L.Icon => {
  switch (config.type) {
    case "custom":
      return new L.Icon({
        iconUrl: config.url!,
        iconSize: config.size || [25, 41],
        iconAnchor: config.anchor || [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

    case "div":
      return new L.DivIcon({
        className: config.className || "custom-div-icon",
        html: `<div style="
          background-color: #3388ff;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

    default:
      return new L.Icon.Default();
  }
};

// カテゴリ別アイコン
export const createCategoryIcon = (category: string): L.Icon => {
  const colors = {
    population: "#ff6b6b",
    economy: "#4ecdc4",
    education: "#45b7d1",
    health: "#96ceb4",
    environment: "#feca57",
    default: "#3388ff",
  };

  const color = colors[category as keyof typeof colors] || colors.default;

  return new L.DivIcon({
    className: "category-icon",
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};
```

### 2. カスタムポップアップ

```typescript
// src/components/leaflet/CustomPopup.tsx
import React from "react";
import { createPortal } from "react-dom";
import { GeoJSONFeature } from "@/types/leaflet";

interface CustomPopupProps {
  feature: GeoJSONFeature;
  position: [number, number];
  onClose: () => void;
}

export const CustomPopup: React.FC<CustomPopupProps> = ({
  feature,
  position,
  onClose,
}) => {
  const { name, value, category, metadata } = feature.properties;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {value !== undefined && (
            <div className="flex justify-between">
              <span className="font-medium">値:</span>
              <span className="text-lg font-bold text-blue-600">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
            </div>
          )}

          {category && (
            <div className="flex justify-between">
              <span className="font-medium">カテゴリ:</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                {category}
              </span>
            </div>
          )}

          {metadata && Object.keys(metadata).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">詳細情報</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
```

## イベントハンドリング

### 1. 地図イベントフック

```typescript
// src/hooks/useMapEvents.ts
import { useCallback, useState } from "react";
import { useMap } from "react-leaflet";
import { GeoJSONFeature } from "@/types/leaflet";

export const useMapEvents = (
  onFeatureClick?: (feature: GeoJSONFeature) => void
) => {
  const map = useMap();
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(
    null
  );
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature | null>(
    null
  );

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    // 地図クリック時の処理
    setSelectedFeature(null);
  }, []);

  const handleFeatureClick = useCallback(
    (feature: GeoJSONFeature) => {
      setSelectedFeature(feature);
      onFeatureClick?.(feature);
    },
    [onFeatureClick]
  );

  const handleFeatureHover = useCallback((feature: GeoJSONFeature) => {
    setHoveredFeature(feature);
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setHoveredFeature(null);
  }, []);

  // 地図イベントの登録
  React.useEffect(() => {
    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, handleMapClick]);

  return {
    selectedFeature,
    hoveredFeature,
    handleFeatureClick,
    handleFeatureHover,
    handleFeatureLeave,
  };
};
```

### 2. レイヤーイベントフック

```typescript
// src/hooks/useLayerEvents.ts
import { useCallback, useState } from "react";
import { GeoJSONFeature } from "@/types/leaflet";

export const useLayerEvents = (layerId: string) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature | null>(
    null
  );

  const handleFeatureHover = useCallback((feature: GeoJSONFeature) => {
    setIsHovered(true);
    setHoveredFeature(feature);
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setIsHovered(false);
    setHoveredFeature(null);
  }, []);

  const handleFeatureClick = useCallback(
    (feature: GeoJSONFeature) => {
      console.log(`Feature clicked in layer ${layerId}:`, feature);
    },
    [layerId]
  );

  return {
    isHovered,
    hoveredFeature,
    handleFeatureHover,
    handleFeatureLeave,
    handleFeatureClick,
  };
};
```

## レスポンシブデザイン

### 1. レスポンシブ地図コンポーネント

```typescript
// src/components/leaflet/ResponsiveMap.tsx
import React, { useRef, useEffect, useState } from "react";
import { MapContainer } from "react-leaflet";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";

interface ResponsiveMapProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveMap: React.FC<ResponsiveMapProps> = ({
  children,
  className = "h-96 w-full",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { isMobile, mapConfig } = useMobileOptimization();

  useEffect(() => {
    const updateDimensions = () => {
      if (mapRef.current) {
        const { width, height } = mapRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: isMobile ? "300px" : "400px" }}
    >
      {dimensions.width > 0 && (
        <MapContainer
          center={mapConfig.center}
          zoom={mapConfig.zoom}
          style={{ height: "100%", width: "100%" }}
          {...mapConfig}
        >
          {children}
        </MapContainer>
      )}
    </div>
  );
};
```

### 2. モバイル最適化フック

```typescript
// src/hooks/useMobileOptimization.ts
import { useState, useEffect } from "react";

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return {
    isMobile,
    mapConfig: isMobile
      ? {
          center: [35.6762, 139.6503] as [number, number],
          zoom: 4,
          maxZoom: 10,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: false,
          dragging: true,
        }
      : {
          center: [35.6762, 139.6503] as [number, number],
          zoom: 5,
          maxZoom: 18,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          dragging: true,
        },
  };
};
```

## パフォーマンス最適化

### 1. レイヤー管理フック

```typescript
// src/hooks/useLayerManager.ts
import { useState, useCallback } from "react";
import { MapLayer } from "@/types/leaflet";

export const useLayerManager = (layers: MapLayer[]) => {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(layers.filter((l) => l.visible).map((l) => l.id))
  );

  const toggleLayer = useCallback((layerId: string) => {
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);

  const isLayerVisible = useCallback(
    (layerId: string) => visibleLayers.has(layerId),
    [visibleLayers]
  );

  return {
    visibleLayers,
    toggleLayer,
    isLayerVisible,
  };
};
```

### 2. 遅延読み込みフック

```typescript
// src/hooks/useLazyLayerData.ts
import { useState, useEffect } from "react";
import { LatLngBounds } from "leaflet";
import { GeoJSONFeature } from "@/types/leaflet";

export const useLazyLayerData = (layerId: string, bounds: LatLngBounds) => {
  const [data, setData] = useState<GeoJSONFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const layerData = await fetchLayerData(layerId, bounds);
        setData(layerData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [layerId, bounds]);

  return { data, loading, error };
};

async function fetchLayerData(
  layerId: string,
  bounds: LatLngBounds
): Promise<GeoJSONFeature[]> {
  // 実際のデータ取得ロジック
  return [];
}
```

## アクセシビリティ

### 1. キーボードナビゲーション

```typescript
// src/hooks/useKeyboardNavigation.ts
import { useEffect, RefObject } from "react";
import { MapContainer } from "react-leaflet";

export const useKeyboardNavigation = (mapRef: RefObject<MapContainer>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      const currentZoom = map.getZoom();

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          map.setZoom(currentZoom + 1);
          break;
        case "-":
          e.preventDefault();
          map.setZoom(currentZoom - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          map.panBy([0, -100]);
          break;
        case "ArrowDown":
          e.preventDefault();
          map.panBy([0, 100]);
          break;
        case "ArrowLeft":
          e.preventDefault();
          map.panBy([-100, 0]);
          break;
        case "ArrowRight":
          e.preventDefault();
          map.panBy([100, 0]);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mapRef]);
};
```

### 2. スクリーンリーダー対応

```typescript
// src/components/leaflet/AccessibleMap.tsx
import React from "react";

interface AccessibleMapProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AccessibleMap: React.FC<AccessibleMapProps> = ({
  children,
  title,
  description,
}) => {
  return (
    <div role="application" aria-label={title}>
      <div className="sr-only">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
};
```

## まとめ

この実装ガイドに従うことで、以下の特徴を持つ Leaflet コンポーネントを作成できます：

1. **再利用性**: モジュール化されたコンポーネント設計
2. **型安全性**: TypeScript による厳密な型定義
3. **パフォーマンス**: 遅延読み込みとレイヤー管理
4. **レスポンシブ**: モバイル・デスクトップ対応
5. **アクセシビリティ**: キーボードナビゲーションとスクリーンリーダー対応
6. **拡張性**: 新しいレイヤータイプの簡単な追加

既存のダッシュボードシステムと統合することで、リッチな地図可視化機能を提供できます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
