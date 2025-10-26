# Geoshape ドメイン

## 概要

Geoshape ドメインは、日本の地理データ（都道府県・市区町村）を管理するドメインです。TopoJSON 形式のデータを直接使用し、D3.js 側で必要に応じて GeoJSON に変換する設計となっています。

### 責任

- 地理データの取得とキャッシュ管理
- TopoJSON 形式のデータ提供
- フォールバック戦略（Mock → R2 → External API）

### 主要な特徴

1. **TopoJSON 直接使用**: サーバー側での変換処理を削除し、D3.js 側で`topojson.feature()`を使用
2. **3 段階フォールバック**: Mock → R2 → External API の順で取得を試みる
3. **キャッシュ効率**: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上
4. **パフォーマンス**: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速

## アーキテクチャ

### データフロー

```
1. GeoshapeService.fetchPrefectureTopology()
   ↓
2. TopoJSONデータを取得（Mock/R2/External API）
   ↓
3. D3.js側でtopojson.feature()を使用してGeoJSONに変換
   ↓
4. 都道府県コード・名前の正規化
   ↓
5. D3.jsで地図を描画
```

### コンポーネント構成

- **GeoshapeService**: メインサービス、データ取得 API 提供
- **GeoshapeRepository**: データソースの抽象化とフォールバック戦略
- **データソース**:
  - `MockDataSource`: 開発環境用のモックデータ
  - `R2DataSource`: Cloudflare R2 ストレージ
  - `ExternalDataSource`: 外部 API（国立情報学研究所の GeoJSON API）
- **ユーティリティ**: TopoJSON 検証関数など

## 型定義

### TopoJSON 型

```typescript
interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
  metadata?: Record<string, any>;
}
```

### PrefectureFeature

```typescript
interface PrefectureFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}
```

### 設定型

```typescript
interface GeoshapeConfig {
  mockDataPath: string;
  externalApiUrl: string;
  r2BucketPath: string;
  cacheMaxAge: number;
}

interface FetchOptions {
  resolution?: ResolutionLevel;
  useCache?: boolean;
  forceRefresh?: boolean;
}

interface FetchResult<T> {
  data: T;
  source: DataSourceType;
  cached: boolean;
  fetchedAt: Date;
}
```

## API リファレンス

### GeoshapeService

#### `fetchPrefectureTopology(options?: FetchOptions): Promise<TopoJSONTopology>`

都道府県の TopoJSON トポロジーを取得。

```typescript
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

const topology = await fetchPrefectureTopology({
  useCache: true,
});

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;

console.log(geojson.features.length); // 47
```

#### `fetchMunicipalityTopology(prefCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`

市区町村の TopoJSON トポロジーを取得。

```typescript
import { fetchMunicipalityTopology } from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

// 兵庫県の市区町村データを取得（統合版）
const topology = await fetchMunicipalityTopology("28", "merged");

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;

console.log(geojson.features.length); // 兵庫県の市区町村数
```

#### `fetchTopologyByAreaCode(areaCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`

地域コードに基づいて TopoJSON トポロジーを取得。

```typescript
import { fetchTopologyByAreaCode } from "@/features/gis/geoshape/services/geoshape-service";

// 都道府県コードの場合
const prefectureTopology = await fetchTopologyByAreaCode("13000");

// 市区町村コードの場合
const municipalityTopology = await fetchTopologyByAreaCode("13101", "merged");
```

#### `checkDataSources(): Promise<{mock: boolean; r2: boolean; external: boolean}>`

データソースの可用性をチェック。

```typescript
const availability = await checkDataSources();
console.log(availability); // { mock: true, r2: false, external: true }
```

#### `clearCache(): void`

キャッシュをクリア。

```typescript
clearCache();
```

#### `getCacheStatus(): {memoryCache: number; r2Available: boolean; externalAvailable: boolean}`

キャッシュステータスを取得。

```typescript
const status = getCacheStatus();
console.log("メモリキャッシュ数:", status.memoryCache);
```

## TopoJSON 直接使用の実装

### 概要

このガイドでは、Geoshape ドメインで TopoJSON を直接使用するアプローチについて詳しく説明します。従来の GeoJSON 変換レイヤーを削除し、D3.js 側で`topojson.feature()`を使用して変換を行う新しい実装パターンを解説します。

### TopoJSON 直接使用のメリット

1. **ファイルサイズの削減**: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速
2. **メモリ効率の向上**: 変換処理を D3.js 側に移譲することで、サーバー側のメモリ使用量を削減
3. **パフォーマンスの向上**: 不要な変換処理を削除し、データ取得が高速化
4. **コードの簡素化**: GeoshapeService の責務をデータ取得のみに集中
5. **キャッシュ効率の向上**: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上

### 基本的なパターン

```typescript
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

// TopoJSONデータを取得
const topology = await fetchPrefectureTopology({
  useCache: true,
});

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;
```

### 都道府県コード・名前の正規化

```typescript
// 都道府県コードと名前を正規化
const normalizedFeatures = geojson.features.map((feature) => {
  const properties = feature.properties || {};

  // 都道府県コードを抽出（5桁形式に正規化）
  const code = properties.N03_007 || properties.prefCode || properties.code;
  const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";

  // 都道府県名を抽出
  const prefName =
    properties.N03_001 || properties.prefName || properties.name || "不明";

  return {
    ...feature,
    properties: {
      ...properties,
      prefCode,
      prefName,
    },
  };
});
```

## 地図実装ガイド

### 基本的な地図表示

```tsx
import { PrefectureMapD3 } from "@/features/visualization/map/d3/PrefectureMapD3";

function MyMapComponent() {
  return (
    <PrefectureMapD3
      width={800}
      height={600}
      className="w-full"
      center={[137, 38]}
      zoom={1}
    />
  );
}
```

### TopoJSON 直接使用によるカスタム実装

```tsx
import { useCallback, useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";

function CustomMapComponent() {
  const svgRef = useRef<SVGSVGElement>(null);

  const renderMap = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      // TopoJSONデータを取得
      const topology = await fetchPrefectureTopology({
        useCache: true,
      });

      // D3.js側でGeoJSONに変換
      const objectName = Object.keys(topology.objects)[0];
      const geojson = topojson.feature(
        topology,
        topology.objects[objectName]
      ) as GeoJSON.FeatureCollection;

      // 都道府県コードと名前を正規化
      const normalizedFeatures = geojson.features.map((feature) => {
        const properties = feature.properties || {};

        const code =
          properties.N03_007 || properties.prefCode || properties.code;
        const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";
        const prefName =
          properties.N03_001 ||
          properties.prefName ||
          properties.name ||
          "不明";

        return {
          ...feature,
          properties: {
            ...properties,
            prefCode,
            prefName,
          },
        };
      });

      const svg = d3.select(svgRef.current);
      const projection = d3.geoMercator().center([137, 38]).scale(1200);
      const path = d3.geoPath().projection(projection);

      // 都道府県を描画
      svg
        .selectAll("path.prefecture")
        .data(normalizedFeatures)
        .enter()
        .append("path")
        .attr("class", "prefecture")
        .attr("d", (d) => path(d as GeoJSON.Feature))
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .on("click", (event, d) => {
          const feature = d as any;
          console.log("選択された都道府県:", feature.properties.prefName);
        });
    } catch (error) {
      console.error("地図の読み込みに失敗:", error);
    }
  }, []);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

  return <svg ref={svgRef} width={800} height={600} />;
}
```

### イベントハンドラーの設定

```tsx
import { PrefectureMapD3 } from "@/features/visualization/map/d3/PrefectureMapD3";

function InteractiveMapComponent() {
  const handlePrefectureClick = (feature) => {
    console.log("選択された都道府県:", feature.properties.prefName);
    // 都道府県詳細ページへの遷移など
  };

  const handlePrefectureHover = (feature) => {
    if (feature) {
      console.log("ホバー中:", feature.properties.prefName);
      // ツールチップの表示など
    }
  };

  return (
    <PrefectureMapD3
      width={800}
      height={600}
      onPrefectureClick={handlePrefectureClick}
      onPrefectureHover={handlePrefectureHover}
    />
  );
}
```

### ランキングデータとの連携

```tsx
import { PrefectureMap } from "@/features/visualization/map/common/PrefectureMap";
import * as d3 from "d3";

function RankingMap({ rankingData }) {
  const getPrefectureColor = (prefCode) => {
    const data = rankingData.find((d) => d.prefCode === prefCode);
    if (!data) return "#e0e0e0";

    // ランキング値に基づいて色を決定
    const normalized =
      data.value / Math.max(...rankingData.map((d) => d.value));
    return d3.interpolateBlues(normalized);
  };

  return (
    <PrefectureMap
      width={800}
      height={600}
      fillColor={(feature) => getPrefectureColor(feature.properties.prefCode)}
    />
  );
}
```

### カスタムツールチップ

```tsx
import { useState } from "react";
import { PrefectureMap } from "@/features/visualization/map/common/PrefectureMap";

function MapWithTooltip() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="relative">
      <PrefectureMap
        width={800}
        height={600}
        onPrefectureHover={(feature) => {
          if (feature) {
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              content: feature.properties.prefName,
            });
          } else {
            setTooltip(null);
          }
        }}
      />

      {tooltip && (
        <div
          className="absolute bg-black text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
```

## データソース別の使用方法

### 1. 都道府県データ

```typescript
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";

const topology = await fetchPrefectureTopology({
  useCache: true,
});
```

### 2. 市区町村データ

```typescript
import { fetchMunicipalityTopology } from "@/features/gis/geoshape/services/geoshape-service";

// 兵庫県の市区町村データを取得（統合版）
const topology = await fetchMunicipalityTopology("28", "merged", {
  useCache: true,
});

// 兵庫県の市区町村データを取得（分割版）
const topologySplit = await fetchMunicipalityTopology("28", "split", {
  useCache: true,
});
```

### 3. 地域コードによる取得

```typescript
import { fetchTopologyByAreaCode } from "@/features/gis/geoshape/services/geoshape-service";

// 都道府県コードの場合
const prefectureTopology = await fetchTopologyByAreaCode("13000");

// 市区町村コードの場合
const municipalityTopology = await fetchTopologyByAreaCode("13101", "merged");
```

## パフォーマンス最適化

### 1. TopoJSON 直接使用のメリット

- **ファイルサイズの削減**: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速
- **メモリ効率**: 変換処理を D3.js 側に移譲することで、サーバー側のメモリ使用量を削減
- **キャッシュ効率**: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上

### 2. メモリキャッシュの活用

```tsx
// 同じデータを複数回取得する場合、キャッシュが効く
const topology1 = await fetchPrefectureTopology({
  useCache: true,
});
const topology2 = await fetchPrefectureTopology({
  useCache: true,
});
// topology2はキャッシュから取得される
```

### 3. 必要に応じたデータ取得

```tsx
// 都道府県データのみ必要な場合
const prefectureTopology = await fetchPrefectureTopology({
  useCache: true,
});

// 特定の都道府県の市区町村データが必要な場合
const municipalityTopology = await fetchMunicipalityTopology("28", "merged", {
  useCache: true,
});
```

### 4. D3.js 側での最適化

```tsx
import { useMemo } from "react";

// 都道府県コード・名前の正規化を一度だけ実行
const normalizedFeatures = useMemo(() => {
  return geojson.features.map((feature) => {
    const properties = feature.properties || {};

    const code = properties.N03_007 || properties.prefCode || properties.code;
    const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";
    const prefName =
      properties.N03_001 || properties.prefName || properties.name || "不明";

    return {
      ...feature,
      properties: {
        ...properties,
        prefCode,
        prefName,
      },
    };
  });
}, [geojson]);
```

### 5. レスポンシブデザイン

```tsx
function ResponsiveMap() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("map-container");
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: Math.min(container.offsetWidth * 0.75, 600),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div id="map-container" className="w-full">
      <PrefectureMap width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
```

## トラブルシューティング

### 1. 地図が表示されない

**原因**: TopoJSON データの取得に失敗している可能性があります。

**解決方法**:

```tsx
// エラーハンドリングを追加
try {
  const topology = await fetchPrefectureTopology({
    useCache: true,
  });

  if (!topology) {
    throw new Error("TopoJSON data not found");
  }

  // データの妥当性チェック
  if (!topology || topology.type !== "Topology") {
    throw new Error("Invalid TopoJSON format");
  }

  // オブジェクトの存在チェック
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) {
    throw new Error("TopoJSON objects is empty");
  }

  // 描画処理...
} catch (error) {
  console.error("地図の読み込みに失敗:", error);
  // エラー状態の表示
}
```

### 2. 都道府県コードが正しく取得できない

**原因**: プロパティの正規化処理に問題がある可能性があります。

**解決方法**:

```tsx
// デバッグ用のログを追加
const normalizedFeatures = geojson.features.map((feature) => {
  const properties = feature.properties || {};

  console.log("Original properties:", properties);

  const code = properties.N03_007 || properties.prefCode || properties.code;
  const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";
  const prefName =
    properties.N03_001 || properties.prefName || properties.name || "不明";

  console.log("Normalized:", { prefCode, prefName });

  return {
    ...feature,
    properties: {
      ...properties,
      prefCode,
      prefName,
    },
  };
});
```

### 3. パフォーマンスが悪い

**原因**: 不要な再計算やメモリリークが発生している可能性があります。

**解決方法**:

```tsx
// useMemoを使用して正規化処理を最適化
const normalizedFeatures = useMemo(() => {
  return geojson.features.map((feature) => {
    const properties = feature.properties || {};

    const code = properties.N03_007 || properties.prefCode || properties.code;
    const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";
    const prefName =
      properties.N03_001 || properties.prefName || properties.name || "不明";

    return {
      ...feature,
      properties: {
        ...properties,
        prefCode,
        prefName,
      },
    };
  });
}, [geojson]);

// useCallbackを使用してイベントハンドラーを最適化
const handlePrefectureClick = useCallback((event, d) => {
  const feature = d as any;
  console.log("選択された都道府県:", feature.properties.prefName);
}, []);
```

### 4. R2 ストレージエラー

**原因**: R2 ストレージの設定が不完全。

**解決方法**:

```tsx
const sources = await checkDataSources();
if (!sources.r2) {
  console.warn("R2ストレージが利用できません");
}
```

## FAQ

### Q: なぜ TopoJSON を直接使用するのですか？

A: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速です。また、変換処理を D3.js 側に移譲することで、サーバー側のメモリ使用量を削減できます。

### Q: 従来の GeoJSON 変換レイヤーは削除されましたか？

A: はい、`convertTopoJsonToGeoJson`関数は削除されました。代わりに、D3.js 側で`topojson.feature()`を使用して変換を行います。

### Q: 都道府県コードの正規化はどこで行いますか？

A: D3.js 側で`topojson.feature()`の変換後に、プロパティの正規化を行います。これにより、データの一貫性を保ちながら、柔軟な処理が可能になります。

### Q: キャッシュはどのように動作しますか？

A: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上します。メモリキャッシュと R2 ストレージキャッシュの両方が利用可能です。

### Q: エラーハンドリングはどうすればよいですか？

A: データ取得時と D3.js 側での変換時に適切なエラーハンドリングを実装してください。特に、TopoJSON の妥当性チェックとオブジェクトの存在チェックが重要です。

### Q: データソースの優先順位は？

A: Mock → R2 → External API の順で取得を試みます。開発環境では Mock データが優先的に使用されます。

## ベストプラクティス

### 1. エラーハンドリング

```tsx
function SafeMapComponent() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error) => {
    setError(error.message);
    setIsLoading(false);
  };

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <PrefectureMap
      width={800}
      height={600}
      onError={handleError}
      onLoad={() => setIsLoading(false)}
    />
  );
}
```

### 2. アクセシビリティ

```tsx
<PrefectureMap
  width={800}
  height={600}
  aria-label="都道府県地図"
  role="img"
  onPrefectureClick={(feature) => {
    // キーボードナビゲーション対応
    if (event.type === "keydown" && event.key !== "Enter") return;
    // クリック処理
  }}
/>
```

## エラーハンドリング

### エラータイプ

```typescript
class GeoshapeError extends Error {
  constructor(message: string, public code?: string);
}

class DataSourceError extends GeoshapeError {
  constructor(message: string, public source: string);
}

class CacheError extends GeoshapeError {
  constructor(message: string);
}
```

### エラー処理例

```typescript
try {
  const features = await fetchPrefectureTopology();
} catch (error) {
  if (error instanceof DataSourceError) {
    console.error("データソースエラー:", error.source, error.message);
  } else if (error instanceof CacheError) {
    console.error("キャッシュエラー:", error.message);
  } else {
    console.error("その他のエラー:", error.message);
  }
}
```

## 関連ドキュメント

- [可視化実装ガイド](./visualization.md)
- [D3.js コロプレスマップ実装ガイド](../04_UI/可視化/implementation/d3js/choropleth-implementation.md)
