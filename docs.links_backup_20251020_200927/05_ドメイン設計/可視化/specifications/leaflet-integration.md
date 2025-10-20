---
title: Leaflet統合設計書
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
  - leaflet
  - mapping
  - geographic-data
---

# Leaflet 統合設計書

## 概要

stats47 プロジェクトに Leaflet を基盤地図として統合し、位置情報を可視化する機能を追加します。既存のアダプターパターンを活用して、様々なデータソースから地理データを取得し、インタラクティブな地図表示を実現します。

## 設計方針

### 1. アダプターパターンの拡張

既存のデータタイプに`geographic`を追加し、地理データ専用のアダプターを実装します。

```typescript
type DataType =
  | "timeSeries"
  | "ranking"
  | "comparison"
  | "distribution"
  | "geographic" // ← 新規追加
  | "categorical";
```

### 2. 既存 D3.js 可視化との共存

- **D3.js**: 静的なコロプレス地図（SVG ベース）
- **Leaflet**: インタラクティブな地図表示（タイルベース）
- 用途に応じて使い分け

### 3. レイヤーアーキテクチャ

```
Leaflet地図コンポーネント
├── 基盤地図レイヤー（OpenStreetMap/国土地理院）
├── 統計データレイヤー
│   ├── マーカーレイヤー（施設、観測地点）
│   ├── ヒートマップレイヤー（密度分布）
│   ├── コロプレスレイヤー（地域別統計）
│   └── ルートレイヤー（交通網）
└── コントロールレイヤー
    ├── レイヤー切り替え
    ├── 凡例表示
    └── ズーム・パンコントロール
```

## 地理データ型定義

### 基本地理データ型

```typescript
// 地理データの基本型
interface GeographicData extends DashboardData {
  type: "geographic";
  features: GeoJSONFeature[];
  bounds: GeographicBounds;
  baseMap?: BaseMapConfig;
  layers: MapLayer[];
}

// GeoJSONフィーチャー
interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: {
    id: string;
    name: string;
    value?: number;
    category?: string;
    metadata?: Record<string, any>;
  };
}

// 地理的境界
interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// 基盤地図設定
interface BaseMapConfig {
  provider: "osm" | "gsi" | "custom";
  tileUrl: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
}

// 地図レイヤー
interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  data: GeoJSONFeature[];
  style?: LayerStyle;
}

type LayerType =
  | "marker" // マーカーレイヤー
  | "heatmap" // ヒートマップレイヤー
  | "choropleth" // コロプレスレイヤー
  | "route" // ルートレイヤー
  | "polygon" // ポリゴンレイヤー
  | "line"; // ラインレイヤー;

// レイヤースタイル
interface LayerStyle {
  color?: string;
  fillColor?: string;
  weight?: number;
  opacity?: number;
  fillOpacity?: number;
  radius?: number;
  icon?: IconConfig;
}

// アイコン設定
interface IconConfig {
  type: "default" | "custom" | "div";
  url?: string;
  size?: [number, number];
  anchor?: [number, number];
  className?: string;
}
```

### 座標系と投影法

```typescript
// 座標系定義
interface CoordinateSystem {
  type: "WGS84" | "JGD2000" | "Tokyo97";
  epsg: string;
  bounds: GeographicBounds;
}

// 投影変換ユーティリティ
class CoordinateTransformer {
  static transform(
    coordinates: [number, number],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): [number, number] {
    // 座標変換ロジック
  }

  static toWebMercator(lat: number, lng: number): [number, number] {
    // Web Mercator投影への変換
  }

  static fromWebMercator(x: number, y: number): [number, number] {
    // Web Mercator投影からの変換
  }
}
```

## Leaflet アーキテクチャ設計

### コンポーネント階層

```typescript
// メイン地図コンポーネント
export const LeafletDashboard: React.FC<LeafletDashboardProps> = ({
  data,
  config,
  onMapReady,
  onFeatureClick,
}) => {
  return (
    <MapContainer
      center={config.center}
      zoom={config.zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <BaseMapLayer config={config.baseMap} />
      <DataLayers layers={data.layers} onFeatureClick={onFeatureClick} />
      <MapControls layers={data.layers} onLayerToggle={handleLayerToggle} />
    </MapContainer>
  );
};

// 基盤地図レイヤー
export const BaseMapLayer: React.FC<BaseMapLayerProps> = ({ config }) => {
  return (
    <TileLayer
      url={config.tileUrl}
      attribution={config.attribution}
      maxZoom={config.maxZoom}
      minZoom={config.minZoom}
    />
  );
};

// データレイヤー群
export const DataLayers: React.FC<DataLayersProps> = ({
  layers,
  onFeatureClick,
}) => {
  return (
    <>
      {layers.map((layer) => (
        <DataLayer
          key={layer.id}
          layer={layer}
          onFeatureClick={onFeatureClick}
        />
      ))}
    </>
  );
};
```

### レイヤー別コンポーネント

```typescript
// マーカーレイヤー
export const MarkerLayer: React.FC<MarkerLayerProps> = ({
  features,
  style,
  onFeatureClick,
}) => {
  return (
    <>
      {features.map((feature) => (
        <Marker
          key={feature.properties.id}
          position={[
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          ]}
          icon={createCustomIcon(style.icon)}
          eventHandlers={{
            click: () => onFeatureClick(feature),
          }}
        >
          <Popup>
            <FeaturePopup feature={feature} />
          </Popup>
        </Marker>
      ))}
    </>
  );
};

// ヒートマップレイヤー
export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  features,
  style,
}) => {
  const heatmapData = useMemo(
    () =>
      features.map((feature) => [
        feature.geometry.coordinates[1], // lat
        feature.geometry.coordinates[0], // lng
        feature.properties.value || 1, // intensity
      ]),
    [features]
  );

  return (
    <HeatmapLayer
      points={heatmapData}
      longitudeExtractor={(point) => point[1]}
      latitudeExtractor={(point) => point[0]}
      intensityExtractor={(point) => point[2]}
      radius={style.radius || 20}
      opacity={style.opacity || 0.6}
    />
  );
};

// コロプレスレイヤー
export const ChoroplethLayer: React.FC<ChoroplethLayerProps> = ({
  features,
  style,
  colorScale,
}) => {
  return (
    <GeoJSON
      data={{
        type: "FeatureCollection",
        features,
      }}
      style={(feature) => ({
        fillColor: colorScale(feature.properties.value),
        weight: style.weight || 2,
        opacity: style.opacity || 1,
        color: "white",
        dashArray: "3",
        fillOpacity: style.fillOpacity || 0.7,
      })}
    />
  );
};
```

## パフォーマンス最適化

### 1. レイヤー管理

```typescript
// レイヤー管理フック
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

  return {
    visibleLayers,
    toggleLayer,
    isLayerVisible: (layerId: string) => visibleLayers.has(layerId),
  };
};
```

### 2. データの遅延読み込み

```typescript
// 遅延読み込みフック
export const useLazyLayerData = (layerId: string, bounds: LatLngBounds) => {
  const [data, setData] = useState<GeoJSONFeature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const layerData = await fetchLayerData(layerId, bounds);
        setData(layerData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [layerId, bounds]);

  return { data, loading };
};
```

### 3. マーカークラスター

```typescript
// マーカークラスターコンポーネント
export const ClusteredMarkerLayer: React.FC<ClusteredMarkerLayerProps> = ({
  features,
  maxClusterRadius = 50,
}) => {
  return (
    <MarkerClusterGroup
      maxClusterRadius={maxClusterRadius}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      zoomToBoundsOnClick={true}
    >
      {features.map((feature) => (
        <Marker
          key={feature.properties.id}
          position={[
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          ]}
        >
          <Popup>
            <FeaturePopup feature={feature} />
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};
```

## イベントハンドリング

### 1. 地図イベント

```typescript
// 地図イベントハンドラー
export const useMapEvents = (
  onFeatureClick?: (feature: GeoJSONFeature) => void
) => {
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(
    null
  );

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
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

  return {
    selectedFeature,
    handleMapClick,
    handleFeatureClick,
  };
};
```

### 2. レイヤーイベント

```typescript
// レイヤーイベントハンドラー
export const useLayerEvents = (layerId: string) => {
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature | null>(
    null
  );

  const handleFeatureHover = useCallback((feature: GeoJSONFeature) => {
    setHoveredFeature(feature);
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setHoveredFeature(null);
  }, []);

  return {
    hoveredFeature,
    handleFeatureHover,
    handleFeatureLeave,
  };
};
```

## レスポンシブデザイン

### 1. 画面サイズ対応

```typescript
// レスポンシブ地図コンポーネント
export const ResponsiveMap: React.FC<ResponsiveMapProps> = ({
  children,
  className,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

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
      style={{ minHeight: "400px" }}
    >
      {dimensions.width > 0 && (
        <MapContainer
          center={[35.6762, 139.6503]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          {children}
        </MapContainer>
      )}
    </div>
  );
};
```

### 2. モバイル対応

```typescript
// モバイル最適化フック
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
          zoom: 4,
          maxZoom: 10,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: false,
        }
      : {
          zoom: 5,
          maxZoom: 18,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
        },
  };
};
```

## アクセシビリティ

### 1. キーボードナビゲーション

```typescript
// キーボードナビゲーション対応
export const useKeyboardNavigation = (mapRef: RefObject<MapContainer>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      const currentZoom = map.getZoom();

      switch (e.key) {
        case "+":
        case "=":
          map.setZoom(currentZoom + 1);
          break;
        case "-":
          map.setZoom(currentZoom - 1);
          break;
        case "ArrowUp":
          map.panBy([0, -100]);
          break;
        case "ArrowDown":
          map.panBy([0, 100]);
          break;
        case "ArrowLeft":
          map.panBy([-100, 0]);
          break;
        case "ArrowRight":
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
// スクリーンリーダー対応コンポーネント
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

## エラーハンドリング

### 1. 地図読み込みエラー

```typescript
// 地図エラーハンドラー
export const useMapErrorHandler = () => {
  const [error, setError] = useState<MapError | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error("Map error:", error);
    setError({
      type: "map_load_error",
      message: "地図の読み込みに失敗しました",
      details: error.message,
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
```

### 2. データ読み込みエラー

```typescript
// データエラーハンドラー
export const useDataErrorHandler = () => {
  const [dataErrors, setDataErrors] = useState<Map<string, DataError>>(
    new Map()
  );

  const handleDataError = useCallback((layerId: string, error: Error) => {
    setDataErrors(
      (prev) =>
        new Map(
          prev.set(layerId, {
            type: "data_load_error",
            message: `レイヤー ${layerId} のデータ読み込みに失敗しました`,
            details: error.message,
          })
        )
    );
  }, []);

  const clearDataError = useCallback((layerId: string) => {
    setDataErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(layerId);
      return newMap;
    });
  }, []);

  return { dataErrors, handleDataError, clearDataError };
};
```

## まとめ

この Leaflet 統合設計により、以下の機能が実現されます：

1. **インタラクティブな地図表示**: ズーム、パン、クリック操作
2. **多様な可視化手法**: マーカー、ヒートマップ、コロプレス
3. **レイヤー管理**: 複数レイヤーの重ね合わせと切り替え
4. **パフォーマンス最適化**: 遅延読み込み、クラスタリング
5. **レスポンシブデザイン**: モバイル・デスクトップ対応
6. **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー対応

既存のアダプターパターンと統合することで、様々なデータソースからの地理データを統一されたインターフェースで処理でき、将来的な拡張性も確保されます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
