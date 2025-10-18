---
title: 地図可視化パターン集
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - patterns
  - leaflet
  - mapping
  - data-visualization
---

# 地図可視化パターン集

## 概要

stats47 プロジェクトで使用する地図可視化パターンの包括的なガイドです。様々なデータタイプとユースケースに対応した可視化手法を提供し、効果的な地理データの表現方法を定義します。

## 基本パターン

### 1. マーカーマップ

#### 用途

- 特定の地点でのデータ値の表示
- 施設や観測地点の位置情報
- 個別のデータポイントの比較

#### 実装例

```typescript
// 基本的なマーカーマップ
export const MarkerMapPattern: React.FC<MarkerMapProps> = ({ data }) => {
  return (
    <MapContainer center={[35.6762, 139.6503]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.features.map((feature) => (
        <Marker
          key={feature.properties.id}
          position={[
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          ]}
          icon={createValueIcon(feature.properties.value)}
        >
          <Popup>
            <div>
              <h3>{feature.properties.name}</h3>
              <p>値: {feature.properties.value?.toLocaleString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

// 値に基づくアイコン作成
const createValueIcon = (value: number) => {
  const size = Math.max(10, Math.min(30, value / 1000));
  const color = getValueColor(value);

  return new L.DivIcon({
    className: "value-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
```

#### バリエーション

**カテゴリ別マーカー**

```typescript
const createCategoryIcon = (category: string) => {
  const colors = {
    population: "#ff6b6b",
    economy: "#4ecdc4",
    education: "#45b7d1",
    health: "#96ceb4",
    environment: "#feca57",
  };

  return new L.DivIcon({
    className: "category-marker",
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${colors[category] || "#3388ff"};
      border-radius: 50%;
      border: 2px solid white;
    "></div>`,
  });
};
```

**アニメーションマーカー**

```typescript
const createAnimatedIcon = (value: number) => {
  const size = Math.max(15, Math.min(40, value / 500));

  return new L.DivIcon({
    className: "animated-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: #3388ff;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    "></div>`,
  });
};
```

### 2. ヒートマップ

#### 用途

- 密度分布の可視化
- 連続的な値の分布パターン
- ホットスポットの特定

#### 実装例

```typescript
export const HeatmapPattern: React.FC<HeatmapProps> = ({ data }) => {
  const heatmapData = useMemo(
    () =>
      data.features.map((feature) => [
        feature.geometry.coordinates[1], // lat
        feature.geometry.coordinates[0], // lng
        feature.properties.value || 1, // intensity
      ]),
    [data.features]
  );

  return (
    <MapContainer center={[35.6762, 139.6503]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <HeatmapLayer
        points={heatmapData}
        longitudeExtractor={(point) => point[1]}
        latitudeExtractor={(point) => point[0]}
        intensityExtractor={(point) => point[2]}
        radius={20}
        opacity={0.6}
        gradient={{
          0.4: "blue",
          0.6: "cyan",
          0.7: "lime",
          0.8: "yellow",
          1.0: "red",
        }}
      />
    </MapContainer>
  );
};
```

#### バリエーション

**時系列ヒートマップ**

```typescript
export const TimeSeriesHeatmap: React.FC<TimeSeriesHeatmapProps> = ({
  data,
  timeRange,
}) => {
  const [currentTime, setCurrentTime] = useState(timeRange.start);

  const currentData = useMemo(
    () =>
      data.features.filter(
        (feature) => feature.properties.timestamp === currentTime
      ),
    [data.features, currentTime]
  );

  return (
    <div>
      <TimeSlider
        value={currentTime}
        min={timeRange.start}
        max={timeRange.end}
        onChange={setCurrentTime}
      />
      <HeatmapPattern data={{ features: currentData }} />
    </div>
  );
};
```

### 3. コロプレスマップ

#### 用途

- 地域別統計データの可視化
- 行政区域での値の比較
- 地理的な分布パターンの分析

#### 実装例

```typescript
export const ChoroplethPattern: React.FC<ChoroplethProps> = ({ data }) => {
  const colorScale = useMemo(() => {
    const values = data.features
      .map((f) => f.properties.value)
      .filter((v) => typeof v === "number") as number[];

    return createColorScale(values, {
      scheme: "blues",
      domain: [Math.min(...values), Math.max(...values)],
    });
  }, [data.features]);

  const styleFunction = (feature: any) => {
    const value = feature.properties.value;
    const color = typeof value === "number" ? colorScale(value) : "#cccccc";

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  return (
    <MapContainer center={[35.6762, 139.6503]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GeoJSON
        data={data}
        style={styleFunction}
        onEachFeature={(feature, layer) => {
          layer.on({
            click: () => console.log("Feature clicked:", feature),
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 3,
                color: "#666",
                dashArray: "",
                fillOpacity: 0.9,
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle(styleFunction(feature));
            },
          });
        }}
      />
    </MapContainer>
  );
};
```

#### バリエーション

**発散型コロプレス**

```typescript
const createDivergingColorScale = (values: number[], midpoint: number) => {
  const min = Math.min(...values);
  const max = Math.max(...values);

  return d3
    .scaleDiverging()
    .domain([min, midpoint, max])
    .interpolator(d3.interpolateRdBu);
};
```

**カテゴリ別コロプレス**

```typescript
const createCategoryColorScale = (categories: string[]) => {
  const colors = d3.schemeCategory10;
  return d3.scaleOrdinal().domain(categories).range(colors);
};
```

### 4. クラスターマップ

#### 用途

- 大量のマーカーの効率的な表示
- 密度の高い地域のグループ化
- パフォーマンスの最適化

#### 実装例

```typescript
export const ClusterMapPattern: React.FC<ClusterMapProps> = ({ data }) => {
  return (
    <MapContainer center={[35.6762, 139.6503]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          const size = Math.min(40, 20 + count * 2);

          return new L.DivIcon({
            className: "cluster-icon",
            html: `<div style="
              width: ${size}px;
              height: ${size}px;
              background-color: #3388ff;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">${count}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        }}
      >
        {data.features.map((feature) => (
          <Marker
            key={feature.properties.id}
            position={[
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0],
            ]}
          >
            <Popup>
              <div>
                <h3>{feature.properties.name}</h3>
                <p>値: {feature.properties.value?.toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
```

### 5. 時系列アニメーション

#### 用途

- 時間の経過に伴う変化の可視化
- トレンドの分析
- 動的なデータの表現

#### 実装例

```typescript
export const TimeSeriesAnimationPattern: React.FC<TimeSeriesProps> = ({
  data,
  timeRange,
}) => {
  const [currentTime, setCurrentTime] = useState(timeRange.start);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms

  const timeSteps = useMemo(
    () =>
      generateTimeSteps(timeRange.start, timeRange.end, timeRange.frequency),
    [timeRange]
  );

  const currentData = useMemo(
    () =>
      data.features.filter(
        (feature) => feature.properties.timestamp === currentTime
      ),
    [data.features, currentTime]
  );

  // アニメーション制御
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const currentIndex = timeSteps.indexOf(prev);
        const nextIndex = (currentIndex + 1) % timeSteps.length;
        return timeSteps[nextIndex];
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, timeSteps]);

  return (
    <div>
      <div className="controls mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isPlaying ? "停止" : "再生"}
        </button>
        <input
          type="range"
          min="500"
          max="3000"
          step="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="ml-4"
        />
        <span className="ml-2">速度: {speed}ms</span>
      </div>

      <div className="time-display mb-4">
        <h3>現在時刻: {formatTime(currentTime)}</h3>
        <input
          type="range"
          min="0"
          max={timeSteps.length - 1}
          value={timeSteps.indexOf(currentTime)}
          onChange={(e) => setCurrentTime(timeSteps[Number(e.target.value)])}
          className="w-full"
        />
      </div>

      <MapContainer center={[35.6762, 139.6503]} zoom={5}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerLayer features={currentData} />
      </MapContainer>
    </div>
  );
};
```

## 高度なパターン

### 1. マルチレイヤー可視化

```typescript
export const MultiLayerPattern: React.FC<MultiLayerProps> = ({ layers }) => {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(layers.map((l) => l.id))
  );

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  return (
    <div>
      <div className="layer-controls mb-4">
        {layers.map((layer) => (
          <label key={layer.id} className="flex items-center">
            <input
              type="checkbox"
              checked={visibleLayers.has(layer.id)}
              onChange={() => toggleLayer(layer.id)}
              className="mr-2"
            />
            {layer.name}
          </label>
        ))}
      </div>

      <MapContainer center={[35.6762, 139.6503]} zoom={5}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {layers.map(
          (layer) =>
            visibleLayers.has(layer.id) && (
              <LayerComponent key={layer.id} layer={layer} />
            )
        )}
      </MapContainer>
    </div>
  );
};
```

### 2. インタラクティブフィルタリング

```typescript
export const InteractiveFilterPattern: React.FC<FilterProps> = ({ data }) => {
  const [filters, setFilters] = useState({
    category: "",
    valueRange: [0, 1000],
    timeRange: [2020, 2023],
  });

  const filteredData = useMemo(
    () =>
      data.features.filter((feature) => {
        const { category, value, timestamp } = feature.properties;

        return (
          (!filters.category || category === filters.category) &&
          value >= filters.valueRange[0] &&
          value <= filters.valueRange[1] &&
          timestamp >= filters.timeRange[0] &&
          timestamp <= filters.timeRange[1]
        );
      }),
    [data.features, filters]
  );

  return (
    <div>
      <div className="filters mb-4 space-y-4">
        <div>
          <label>カテゴリ:</label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            <option value="">すべて</option>
            <option value="population">人口</option>
            <option value="economy">経済</option>
            <option value="education">教育</option>
          </select>
        </div>

        <div>
          <label>
            値の範囲: {filters.valueRange[0]} - {filters.valueRange[1]}
          </label>
          <RangeSlider
            value={filters.valueRange}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, valueRange: value }))
            }
            min={0}
            max={1000}
          />
        </div>
      </div>

      <MapContainer center={[35.6762, 139.6503]} zoom={5}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerLayer features={filteredData} />
      </MapContainer>
    </div>
  );
};
```

### 3. 3D 可視化（Mapbox GL 統合）

```typescript
export const Mapbox3DPattern: React.FC<Mapbox3DProps> = ({ data }) => {
  return (
    <Map
      mapStyle="mapbox://styles/mapbox/streets-v11"
      center={[139.6503, 35.6762]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
    >
      <Source id="data" type="geojson" data={data}>
        <Layer
          id="3d-buildings"
          type="fill-extrusion"
          paint={{
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0,
              0,
              1000,
              100,
            ],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.6,
          }}
        />
      </Source>
    </Map>
  );
};
```

## パフォーマンス最適化パターン

### 1. 仮想化マーカー

```typescript
export const VirtualizedMarkerPattern: React.FC<VirtualizedProps> = ({
  data,
}) => {
  const [viewport, setViewport] = useState({
    bounds: null as LatLngBounds | null,
    zoom: 5,
  });

  const visibleFeatures = useMemo(
    () =>
      data.features.filter((feature) => {
        if (!viewport.bounds) return true;

        const [lng, lat] = feature.geometry.coordinates;
        return viewport.bounds.contains([lat, lng]);
      }),
    [data.features, viewport.bounds]
  );

  return (
    <MapContainer
      center={[35.6762, 139.6503]}
      zoom={5}
      onViewportChange={setViewport}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerLayer features={visibleFeatures} />
    </MapContainer>
  );
};
```

### 2. 遅延読み込み

```typescript
export const LazyLoadingPattern: React.FC<LazyLoadingProps> = ({
  layerId,
  bounds,
}) => {
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

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return <MarkerLayer features={data} />;
};
```

## まとめ

これらの地図可視化パターンにより、様々なデータタイプとユースケースに対応した効果的な地理データの可視化が可能になります。各パターンは独立して使用することも、組み合わせてより複雑な可視化を作成することもできます。

パターンの選択は以下の要因を考慮して決定します：

1. **データの性質**: ポイント、エリア、時系列など
2. **データ量**: 少数のポイント vs 大量のデータ
3. **ユーザーの目的**: 探索、分析、比較など
4. **パフォーマンス要件**: レスポンス時間、メモリ使用量
5. **デバイス制約**: モバイル、デスクトップ

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
