# Geoshape ドメイン設計

## 1. 概要

Geoshape ドメインは、日本の地理空間データ（歴史的行政区域データセットを含む）を管理する。主な責務は、TopoJSON 形式の地理データを外部ソースから取得し、キャッシュを通じて効率的に提供することです。

### 1.1. 主な責務

- **地理データの取得**: 外部 API（Geoshape API 等）から TopoJSON 形式のデータを取得する。
- **キャッシュ管理**: 取得したデータを Cloudflare R2 などのストレージにキャッシュし、高速なデータ配信を実現する。
- **データ提供**: アプリケーションの各機能（地図可視化など）に対して、要求された TopoJSON データを提供する。
- **フォールバック戦略**: データ取得の信頼性を高めるため、Mock → R2 → 外部 API の順でフォールバックを行う。
- **データソース表記管理**: データ提供元のライセンス（CC BY 4.0 等）に基づいた適切な出典表記を管理する。

### 1.2. 技術的特徴

- **TopoJSON の直接利用**: クライアント側（D3.js）で GeoJSON に変換することを前提とし、サーバーは TopoJSON を直接扱う。これにより、データ転送量とサーバーサイドの処理負荷を削減する。
- **解像度の動的選択**: 地図のズームレベルや用途に応じて、最適な解像度（低・中・高・フル）のデータを動的に選択する。
- **CDN による高速配信**: Cloudflare CDN を活用し、キャッシュされた地理データを高速に配信する。

## 2. アーキテクチャ

### 2.1. データフロー

1.  **リクエスト**: クライアント（例: 地図コンポーネント）が `GeoshapeService` に地理データを要求する。
2.  **データ取得**: `GeoshapeService` は `GeoshapeRepository` を通じて、以下の優先順位でデータを取得する。
    1.  インメモリキャッシュ
    2.  R2 ストレージキャッシュ
    3.  外部データソース（Geoshape API）
3.  **データ提供**: 取得した TopoJSON データをクライアントに返す。
4.  **クライアントサイド変換**: クライアント（D3.js）は受け取った TopoJSON データを `topojson.feature()` を用いて GeoJSON に変換し、地図を描画する。

### 2.2. コンポーネント構成とディレクトリ構造

```
src/features/gis/geoshape/  (または src/infrastructure/geoshape/)
├── services/
│   ├── geoshape-service.ts       # ドメインサービス: データ取得のメインAPIを提供
│   └── ...
├── repositories/
│   └── geoshape-repository.ts    # データソースの抽象化とフォールバック戦略
├── models/ (または types/)
│   ├── geoshape.ts             # TopoJSON, GeoJSON関連の型定義
│   └── ...
└── sources/
    ├── mock-data-source.ts     # 開発用のモックデータソース
    ├── r2-data-source.ts       # Cloudflare R2 ストレージソース
    └── external-data-source.ts # 外部APIデータソース
```

- **GeoshapeService**: ドメインのメインサービス。データ取得のインターフェースを提供する。
- **GeoshapeRepository**: データソース（キャッシュ、外部API）を抽象化し、フォールバック戦略を実装する。
- **データソース (Mock, R2, External)**: 各データソースからの具体的なデータ取得ロジックを実装する。

## 3. データモデルと型定義

### 3.1. 主要な型

```typescript
// TopoJSON の基本構造
interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
}

// 都道府県の地理的特徴 (GeoJSON Feature)
interface PrefectureFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    prefCode: string; // 5桁の都道府県コード (例: "13000")
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}

// 市区町村の地理的特徴 (GeoJSON Feature)
interface MunicipalityFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    cityCode: string; // 5桁の市区町村コード
    cityName: string;
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}
```

### 3.2. 値オブジェクト

#### Resolution
解像度レベルを表す値オブジェクト。

- **値**: `l` (低), `c` (中), `h` (高), `f` (フル)
- **責務**: ズームレベルに応じた適切性の判断、表示名の提供。

#### DataAttribution
データ出典情報を表す値オブジェクト。

- **プロパティ**: `source` (提供元), `provider` (提供者), `license` (ライセンス), `url`
- **責務**: 適切な出典表記テキストの生成。

## 4. API リファレンス (GeoshapeService)

#### `fetchPrefectureTopology(options?: FetchOptions): Promise<TopoJSONTopology>`
全国の都道府県の TopoJSON トポロジーを取得する。

#### `fetchMunicipalityTopology(prefCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`
指定された都道府県の市区町村 TopoJSON トポロジーを取得する。

#### `fetchTopologyByAreaCode(areaCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`
地域コード（都道府県または市区町村）に基づいて TopoJSON トポロジーを取得する。

#### `checkDataSources(): Promise<{mock: boolean; r2: boolean; external: boolean}>`
利用可能なデータソースのステータスを確認する。

## 5. データソース仕様

### 5.1. 提供元情報

- **データセット名**: 歴史的行政区域データセット β 版
- **提供者**: GeoNLP プロジェクト、ROIS-DS 人文学オープンデータ共同利用センター（CODH）
- **ライセンス**: CC BY 4.0
- **URL**: https://geoshape.ex.nii.ac.jp/

### 5.2. API 仕様

- **URL形式**: `https://geoshape.ex.nii.ac.jp/city/topojson/{YYYYMMDD}/jp_{level}.{resolution}.topojson`
- **パラメータ**:
  - `YYYYMMDD`: 対象年度 (例: `20230101`)
  - `level`: 行政レベル (`pref`: 都道府県, `city`: 市区町村)
  - `resolution`: 解像度 (`l`, `c`, `h`, `f`)

### 5.3. 解像度仕様

| 解像度 | 説明 | 用途 | 推定サイズ |
| :--- | :--- | :--- | :--- |
| `l` | 低解像度 | 概要表示、モバイル | ~1MB |
| `c` | 中解像度 | 標準表示 | ~5MB |
| `h` | 高解像度 | 詳細表示 | ~15MB |
| `f` | 完全解像度 | 最高品質 | ~50MB |

## 6. 関連ドメイン

- **Area ドメイン**: 地域コードと地理データを関連付ける。
- **Visualization ドメイン**: 本ドメインが提供する TopoJSON データを利用してコロプレス地図などを描画する。