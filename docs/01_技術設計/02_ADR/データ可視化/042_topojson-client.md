---
title: topojson-client 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - データ可視化
  - topojson-client
---

# topojson-client 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、地図可視化において以下の要件を満たすライブラリが必要でした：

1. **TopoJSON処理**: 地理データの効率的な処理と変換
2. **D3.js統合**: D3.jsとの組み合わせでの使用
3. **軽量化**: 地図データのサイズ最適化
4. **パフォーマンス**: 高速な地理データ変換

## 決定

**topojson-client** を採用

## 理由

### 1. TopoJSON処理の専門性
- **専用ライブラリ**: TopoJSON処理に特化
- **効率的な変換**: TopoJSONからGeoJSONへの高速変換
- **軽量化**: 地理データのサイズを大幅に削減

### 2. D3.jsとの統合
- **完全互換**: D3.jsとの完全な統合
- **APIの一貫性**: D3.jsのAPIパターンに準拠
- **学習コスト**: D3.jsと同様のAPIで学習コストが低い

### 3. パフォーマンスの優位性
- **高速処理**: 地理データの変換が高速
- **メモリ効率**: 効率的なメモリ使用
- **Tree-shaking**: 必要な機能のみをバンドルに含める

## 使用箇所

### 1. コロプレスマップ
```typescript
import * as topojson from "topojson-client";

// TopoJSONからGeoJSONへの変換
const geojson = topojson.feature(topology, topology.objects.prefectures);

// D3.jsでの地図描画
const path = d3.geoPath().projection(projection);
const features = geojson.features;
```

### 2. 地図データの最適化
```typescript
// 地理データの軽量化
const simplified = topojson.simplify(topology, 0.1);

// 必要な部分のみの抽出
const prefectures = topojson.feature(topology, topology.objects.prefectures);
```

### 3. データ変換
```typescript
// TopoJSON形式でのデータ処理
const bounds = topojson.bounds(topology);
const quantized = topojson.quantize(topology, 1e4);
```

## 代替案の検討

### 手動実装
**メリット:**
- 完全な制御
- 依存関係の削減

**デメリット:**
- 開発工数が大きい
- パフォーマンスの最適化が困難
- バグのリスク

**結論:** 開発効率を考慮し不採用

### 他の地理データライブラリ
**Turf.js:**
- 地理データ処理に特化
- TopoJSON処理は限定的
- バンドルサイズが大きい

**Leaflet:**
- 地図表示に特化
- TopoJSON処理機能なし
- 用途が異なる

**結論:** TopoJSON処理の専門性を考慮し不採用

## 結果

この決定により以下の効果が期待されます：

### 1. パフォーマンスの向上
- 地理データの高速変換
- メモリ使用量の最適化
- ロード時間の短縮

### 2. 開発効率の向上
- 専用ライブラリによる迅速な実装
- D3.jsとの統合による一貫したAPI
- バグのリスク軽減

### 3. データサイズの最適化
- TopoJSONによる軽量化
- ネットワーク転送量の削減
- ユーザー体験の向上

## 実装方針

### 1. D3.jsとの組み合わせ
- D3.jsの地理投影と組み合わせて使用
- 一貫したAPIパターンの維持
- 型安全性の確保

### 2. パフォーマンス最適化
- データの遅延読み込み
- 必要に応じた簡素化
- キャッシュ戦略の実装

### 3. エラーハンドリング
- 無効なTopoJSONデータの処理
- 変換エラーの適切な処理
- フォールバック機能の実装

## 参考資料

- [topojson-client公式ドキュメント](https://github.com/topojson/topojson-client)
- [TopoJSON仕様](https://github.com/topojson/topojson-specification)
- [D3.js地理投影](https://github.com/d3/d3-geo)
