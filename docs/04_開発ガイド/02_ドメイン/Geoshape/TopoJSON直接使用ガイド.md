# TopoJSON 直接使用ガイド

## 概要

このガイドでは、Geoshape ドメインで TopoJSON を直接使用するアプローチについて詳しく説明します。従来の GeoJSON 変換レイヤーを削除し、D3.js 側で`topojson.feature()`を使用して変換を行う新しい実装パターンを解説します。

## 背景と理由

### 従来のアプローチの問題点

1. **不要な変換処理**: GeoshapeService 内で TopoJSON → GeoJSON 変換を行っていた
2. **メモリ使用量の増加**: 変換後の GeoJSON データをメモリに保持していた
3. **パフォーマンスの低下**: サーバー側での変換処理がボトルネックになっていた
4. **コードの複雑化**: 変換ロジックが GeoshapeService に散在していた

### TopoJSON 直接使用のメリット

1. **ファイルサイズの削減**: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速
2. **メモリ効率の向上**: 変換処理を D3.js 側に移譲することで、サーバー側のメモリ使用量を削減
3. **パフォーマンスの向上**: 不要な変換処理を削除し、データ取得が高速化
4. **コードの簡素化**: GeoshapeService の責務をデータ取得のみに集中
5. **キャッシュ効率の向上**: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上

## 実装パターン

### 1. 基本的なパターン

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

### 2. 都道府県コード・名前の正規化

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

### 3. React コンポーネントでの実装

```tsx
import { useCallback, useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";

function PrefectureMap() {
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

### 1. メモリキャッシュの活用

```typescript
// 同じデータを複数回取得する場合、キャッシュが効く
const topology1 = await fetchPrefectureTopology({
  useCache: true,
});
const topology2 = await fetchPrefectureTopology({
  useCache: true,
});
// topology2はキャッシュから取得される
```

### 2. D3.js 側での最適化

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

### 3. エラーハンドリング

```tsx
const renderMap = useCallback(async () => {
  if (!svgRef.current) return;

  try {
    const topology = await fetchPrefectureTopology({
      useCache: true,
    });

    // データの妥当性チェック
    if (!topology || topology.type !== "Topology") {
      throw new Error("Invalid TopoJSON format");
    }

    // オブジェクトの存在チェック
    const objectName = Object.keys(topology.objects)[0];
    if (!objectName) {
      throw new Error("TopoJSON objects is empty");
    }

    // 変換と描画処理
    const geojson = topojson.feature(
      topology,
      topology.objects[objectName]
    ) as GeoJSON.FeatureCollection;

    // 描画処理...
  } catch (error) {
    console.error("地図の読み込みに失敗:", error);
    // エラー状態の表示
  }
}, []);
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

## 関連ドキュメント

- [Geoshape API リファレンス](./APIリファレンス.md)
- [地図実装ガイド](./地図実装ガイド.md)
- [D3.js コロプレスマップ実装ガイド](../04_UI/可視化/implementation/d3js/choropleth-implementation.md)
