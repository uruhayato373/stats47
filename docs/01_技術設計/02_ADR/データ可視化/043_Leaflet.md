---
title: Leaflet 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - データ可視化
  - Leaflet
---

# Leaflet 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、地図表示において以下の要件を満たすライブラリが必要でした：

1. **地図表示**: インタラクティブな地図の表示
2. **React統合**: Reactコンポーネントとしての使用
3. **軽量性**: バンドルサイズの最小化
4. **カスタマイズ性**: 地図スタイルのカスタマイズ

## 決定

**Leaflet** を採用

## 理由

### 1. 軽量性とパフォーマンス
- **軽量**: 他の地図ライブラリより軽量
- **高速**: 高速な地図レンダリング
- **モバイル対応**: モバイルデバイスでの最適化

### 2. React統合
- **react-leaflet**: React専用のラッパーライブラリ
- **コンポーネント化**: Reactコンポーネントとして使用可能
- **TypeScript対応**: 型安全な地図コンポーネント

### 3. カスタマイズ性
- **柔軟なスタイリング**: 地図スタイルの自由なカスタマイズ
- **プラグインシステム**: 豊富なプラグインエコシステム
- **オープンソース**: 完全にオープンソース

### 4. 学習コストの低さ
- **シンプルなAPI**: 直感的で理解しやすいAPI
- **豊富なドキュメント**: 充実したドキュメント
- **コミュニティ**: 活発なコミュニティサポート

## 使用箇所

### 1. 基本地図表示
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapComponent = () => (
  <MapContainer center={[35.6762, 139.6503]} zoom={13}>
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
    <Marker position={[35.6762, 139.6503]}>
      <Popup>
        東京
      </Popup>
    </Marker>
  </MapContainer>
);
```

### 2. コロプレスマップ
```typescript
import { GeoJSON } from 'react-leaflet';

const ChoroplethMap = ({ data }) => (
  <MapContainer>
    <TileLayer />
    <GeoJSON
      data={data}
      style={(feature) => ({
        fillColor: getColor(feature.properties.value),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      })}
    />
  </MapContainer>
);
```

### 3. インタラクティブ機能
```typescript
import { useMapEvents } from 'react-leaflet';

const MapEvents = () => {
  useMapEvents({
    click: (e) => {
      console.log('Clicked at:', e.latlng);
    },
    zoom: (e) => {
      console.log('Zoom level:', e.target.getZoom());
    }
  });
  return null;
};
```

## 代替案の検討

### Mapbox GL JS
**メリット:**
- 高性能な地図表示
- 豊富な地図スタイル
- 3D地図対応

**デメリット:**
- ライセンス費用が発生
- バンドルサイズが大きい
- 学習コストが高い

**結論:** コストと複雑性を考慮し不採用

### Google Maps
**メリット:**
- 高品質な地図データ
- 豊富な機能
- 広く使用されている

**デメリット:**
- ライセンス費用が発生
- カスタマイズ性が限定的
- APIキーが必要

**結論:** コストとカスタマイズ性を考慮し不採用

### OpenLayers
**メリット:**
- 高機能
- 柔軟性が高い
- オープンソース

**デメリット:**
- 学習コストが高い
- バンドルサイズが大きい
- React統合が複雑

**結論:** 学習コストとバンドルサイズを考慮し不採用

## 結果

この決定により以下の効果が期待されます：

### 1. パフォーマンスの向上
- 軽量なライブラリによる高速ロード
- モバイルデバイスでの最適化
- メモリ使用量の削減

### 2. 開発効率の向上
- React統合による迅速な実装
- 直感的なAPIによる開発効率化
- 豊富なドキュメントによる学習効率化

### 3. カスタマイズ性の確保
- 自由な地図スタイルの実装
- プラグインによる機能拡張
- ブランドアイデンティティの反映

## 実装方針

### 1. React統合
- react-leafletを使用したコンポーネント化
- TypeScript対応の型安全な実装
- カスタムフックの活用

### 2. パフォーマンス最適化
- 地図の遅延読み込み
- 不要な再レンダリングの防止
- メモリ使用量の監視

### 3. アクセシビリティ対応
- キーボードナビゲーション
- スクリーンリーダー対応
- 高コントラストモード対応

## 参考資料

- [Leaflet公式ドキュメント](https://leafletjs.com/)
- [react-leaflet公式ドキュメント](https://react-leaflet.js.org/)
- [Leafletプラグイン](https://leafletjs.com/plugins.html)
