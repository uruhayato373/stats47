---
title: Visualization ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - コアドメイン
  - Visualization
---

# Visualization ドメイン

## 概要

Visualization ドメインは、stats47 プロジェクトのコアドメインの一つで、統計データの視覚表現を担当します。コロプレスマップ、グラフ生成、チャート設定管理など、データの可視化に関するすべての機能を提供します。

### ビジネス価値

- **直感的なデータ理解**: 複雑な統計データを視覚的に表現し、ユーザーが直感的に理解できる
- **インタラクティブな探索**: ユーザーがデータを探索し、発見できる環境を提供
- **多様な表現形式**: 地図、グラフ、チャートなど、データに適した最適な表現形式を選択

## 責務

- 地図表示（コロプレスマップ）
- グラフ生成（折れ線、棒、円グラフ）
- チャート設定管理
- レスポンシブ表示
- 色スケール管理
- 凡例生成
- 時系列グラフ生成
- インタラクティブ地図
- 歴史的行政区域データの管理
- データソース表記の生成
- 年度別地理データの管理

## 主要エンティティ

### ChoroplethMap（コロプレスマップ）

地理データと統計値を組み合わせたコロプレスマップを管理するエンティティ。

**属性:**
- `geoData`: 地理データ（TopoJSON）
- `values`: 値データ
- `colorScale`: 色スケール
- `legend`: 凡例設定
- `classificationMethod`: 分類方法（等間隔、分位数、自然分類）
- `interactiveOptions`: インタラクティブ設定

### ChartConfiguration（チャート設定）

グラフやチャートの設定を管理するエンティティ。

**属性:**
- `chartType`: チャートタイプ
- `dataSource`: データソース
- `displayOptions`: 表示オプション
- `responsive`: レスポンシブ設定

### GeoShape（地理形状データ）

地理形状データとそのメタデータを管理するエンティティ。

**属性:**
- `areaCode`: 市区町村 ID（歴史的行政区域データセット）
- `standardAreaCode`: 標準地域コード（e-Stat 対応）
- `areaName`: 地域名
- `areaType`: 地域タイプ（prefecture/municipality）
- `year`: 適用年度（歴史的データの場合）
- `topoJson`: TopoJSON データ
- `boundingBox`: バウンディングボックス
- `representativePoint`: 代表点（{lat, lng}）
- `properties`: 地理的プロパティ（人口、面積等）
- `dataSource`: データソース（'geoshape_codh'/'ksj'）
- `dataVersion`: データバージョン
- `lastUpdated`: データ更新日
- `resolution`: 解像度（'low'/'medium'/'high'/'full'）
- `cacheKey`: R2 キャッシュキー
- `fetchUrl`: Geoshape API URL

### DataSourceAttribution（データソース表記）

データソースの表記情報を管理するエンティティ。

**属性:**
- `source`: データソース名
- `attribution`: 表記文字列
- `license`: ライセンス（CC BY 4.0）
- `url`: データソース URL
- `doi`: DOI 識別子（例：doi:10.20676/00000447）
- `publisher`: 発行者（CODH 作成）

### ColorScale（色スケール）

色スケールの設定を管理するエンティティ。

**属性:**
- `type`: スケールタイプ（Sequential、Diverging）
- `colors`: 色配列
- `domain`: 値の範囲
- `range`: 色の範囲

### BasemapType（ベースマップタイプ）

ベースマップの設定を管理するエンティティ。

**属性:**
- `type`: ベースマップタイプ（'std'/'pale'/'blank'/'photo'）
- `url`: タイル URL
- `attribution`: 出典表示文字列
- `maxZoom`: 最大ズームレベル
- `name`: 表示名（標準地図、淡色地図等）
- `icon`: アイコン（絵文字）

## 値オブジェクト

### Resolution（解像度）

地理データの解像度を表現する値オブジェクト。

```typescript
export class Resolution {
  private constructor(private readonly value: string) {}

  static readonly LOW = new Resolution("low");        // ~0.05MB
  static readonly MEDIUM = new Resolution("medium");  // ~0.19MB
  static readonly HIGH = new Resolution("high");      // ~1MB
  static readonly FULL = new Resolution("full");      // ~3MB

  static create(value: string): Result<Resolution> {
    const validValues = ["low", "medium", "high", "full"];
    if (!validValues.includes(value)) {
      return Result.fail(`Invalid resolution: ${value}`);
    }
    return Result.ok(new Resolution(value));
  }

  getValue(): string {
    return this.value;
  }

  getFileExtension(): string {
    const extensions = {
      low: ".l.topojson",
      medium: ".c.topojson",
      high: ".h.topojson",
      full: ".f.topojson"
    };
    return extensions[this.value as keyof typeof extensions];
  }

  getEstimatedSize(): string {
    const sizes = {
      low: "~0.05MB",
      medium: "~0.19MB",
      high: "~1MB",
      full: "~3MB"
    };
    return sizes[this.value as keyof typeof sizes];
  }
}
```

### ColorScheme（配色）

色スキームを表現する値オブジェクト。

```typescript
export class ColorScheme {
  private constructor(
    private readonly type: string,
    private readonly colors: string[]
  ) {}

  static readonly SEQUENTIAL = new ColorScheme("sequential", [
    "#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6",
    "#4292c6", "#2171b5", "#08519c", "#08306b"
  ]);

  static readonly DIVERGING = new ColorScheme("diverging", [
    "#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7",
    "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"
  ]);

  getType(): string {
    return this.type;
  }

  getColors(): string[] {
    return [...this.colors];
  }
}
```

## ドメインサービス

### ChoroplethRenderService

コロプレスマップの描画ロジックを実装するドメインサービス。

```typescript
export class ChoroplethRenderService {
  constructor(
    private colorScaleService: ColorScaleService,
    private classificationService: ClassificationService
  ) {}

  async renderChoroplethMap(
    geoData: TopoJsonData,
    values: Map<string, number>,
    options: ChoroplethOptions
  ): Promise<ChoroplethMap> {
    // 1. 色スケールを生成
    const colorScale = await this.colorScaleService.generateColorScale(
      Array.from(values.values()),
      options.colorScheme
    );

    // 2. 分類方法を適用
    const classifiedValues = this.classificationService.classify(
      values,
      options.classificationMethod
    );

    // 3. コロプレスマップを構築
    return ChoroplethMap.create({
      geoData,
      values: classifiedValues,
      colorScale,
      legend: this.generateLegend(colorScale, classifiedValues),
      interactiveOptions: options.interactiveOptions,
    }).getValue();
  }

  private generateLegend(
    colorScale: ColorScale,
    values: Map<string, number>
  ): Legend {
    // 凡例生成ロジック
    // 実装省略
  }
}
```

### GeoshapeFetchService

Geoshape APIからの地理データ取得を管理するドメインサービス。

```typescript
export class GeoshapeFetchService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly httpClient: HttpClient
  ) {}

  async fetchPrefectureTopoJson(
    date: string,
    resolution: Resolution
  ): Promise<Result<TopoJsonData>> {
    const url = this.buildPrefectureUrl(date, resolution);
    const cacheKey = this.buildCacheKey("prefecture", date, resolution);

    // R2キャッシュから取得を試行
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return Result.ok(cached);
    }

    // Geoshape APIから取得
    try {
      const response = await this.httpClient.get(url);
      const topoJson = await response.json();

      // R2にキャッシュ保存（TTL: 30日）
      await this.cacheService.set(cacheKey, topoJson, 30 * 24 * 60 * 60);

      return Result.ok(topoJson);
    } catch (error) {
      return Result.fail(`Failed to fetch TopoJSON: ${error.message}`);
    }
  }

  private buildPrefectureUrl(date: string, resolution: Resolution): string {
    const baseUrl = "https://geoshape.ex.nii.ac.jp/city/topojson";
    const extension = resolution.getFileExtension();
    return `${baseUrl}/${date}/jp_pref${extension}`;
  }
}
```

### AttributionService

データソース表記の生成を管理するドメインサービス。

```typescript
export class AttributionService {
  generateAttribution(dataSources: DataSource[]): DataSourceAttribution[] {
    return dataSources.map((source) => {
      switch (source.type) {
        case "geoshape_codh":
          return new DataSourceAttribution({
            source: "geoshape_codh",
            attribution: "『歴史的行政区域データセットβ版』（CODH作成）",
            license: "CC BY 4.0",
            url: "https://geoshape.ex.nii.ac.jp/city/",
            doi: "doi:10.20676/00000447",
            publisher: "CODH作成"
          });
        case "ksj":
          return new DataSourceAttribution({
            source: "ksj",
            attribution: "国土数値情報（国土交通省）",
            license: "CC BY 4.0",
            url: "https://nlftp.mlit.go.jp/ksj/",
            publisher: "国土交通省"
          });
        default:
          throw new Error(`Unknown data source: ${source.type}`);
      }
    });
  }
}
```

## リポジトリ

### GeoShapeRepository

地理形状データの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface GeoShapeRepository {
  findByAreaCode(areaCode: string): Promise<GeoShape | null>;
  findByAreaCodeAndYear(areaCode: string, year: number): Promise<GeoShape | null>;
  findByAreaType(areaType: string): Promise<GeoShape[]>;
  save(geoShape: GeoShape): Promise<void>;
  delete(areaCode: string): Promise<void>;
  exists(areaCode: string): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/domain/visualization/
├── map/
│   ├── choropleth/
│   │   ├── entities/
│   │   │   ├── ChoroplethMap.ts
│   │   │   ├── GeoShape.ts
│   │   │   ├── ColorScale.ts
│   │   │   └── DataSourceAttribution.ts
│   │   ├── value-objects/
│   │   │   ├── ColorScheme.ts
│   │   │   ├── ClassificationMethod.ts
│   │   │   ├── Legend.ts
│   │   │   ├── DataSource.ts
│   │   │   ├── YearRange.ts
│   │   │   ├── Resolution.ts
│   │   │   ├── CacheKey.ts
│   │   │   └── BasemapType.ts
│   │   ├── services/
│   │   │   ├── ChoroplethRenderService.ts
│   │   │   ├── ColorScaleService.ts
│   │   │   ├── ClassificationService.ts
│   │   │   ├── AttributionService.ts
│   │   │   ├── GeoshapeFetchService.ts
│   │   │   ├── CacheService.ts
│   │   │   └── BasemapService.ts
│   │   └── repositories/
│   │       └── GeoShapeRepository.ts
│   └── geoshape/
│       ├── entities/
│       │   └── HistoricalGeoShape.ts
│       └── repositories/
│           └── GeoShapeRepository.ts
├── chart/
│   ├── time-series/
│   │   ├── entities/
│   │   │   ├── LineChart.ts
│   │   │   └── TrendLine.ts
│   │   └── services/
│   │       └── TimeSeriesChartService.ts
│   ├── bar-chart/
│   │   └── entities/
│   │       └── BarChart.ts
│   └── recharts/
│       └── adapters/
│           └── RechartsAdapter.ts
└── dashboard/
    ├── layout/
    │   ├── entities/
    │   │   └── DashboardLayout.ts
    │   └── services/
    │       └── LayoutService.ts
    └── widgets/
        └── entities/
            └── Widget.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/visualization/map/choropleth/entities/ChoroplethMap.ts
export class ChoroplethMap {
  private constructor(
    private readonly geoData: TopoJsonData,
    private readonly values: Map<string, number>,
    private readonly colorScale: ColorScale,
    private readonly legend: Legend,
    private readonly classificationMethod: ClassificationMethod,
    private readonly interactiveOptions: InteractiveOptions
  ) {}

  static create(props: {
    geoData: TopoJsonData;
    values: Map<string, number>;
    colorScale: ColorScale;
    legend: Legend;
    classificationMethod: ClassificationMethod;
    interactiveOptions: InteractiveOptions;
  }): Result<ChoroplethMap> {
    if (!props.geoData || !props.values || props.values.size === 0) {
      return Result.fail("Invalid choropleth map data");
    }

    return Result.ok(
      new ChoroplethMap(
        props.geoData,
        props.values,
        props.colorScale,
        props.legend,
        props.classificationMethod,
        props.interactiveOptions
      )
    );
  }

  getColorForArea(areaCode: string): string {
    const value = this.values.get(areaCode);
    if (value === undefined) {
      return this.colorScale.getDefaultColor();
    }
    return this.colorScale.getColorForValue(value);
  }

  getLegend(): Legend {
    return this.legend;
  }

  isInteractive(): boolean {
    return this.interactiveOptions.enabled;
  }
}
```

### 値オブジェクト実装例

```typescript
// src/domain/visualization/map/choropleth/value-objects/BasemapType.ts
export class BasemapType {
  private constructor(
    private readonly type: string,
    private readonly url: string,
    private readonly attribution: string,
    private readonly maxZoom: number,
    private readonly name: string,
    private readonly icon: string
  ) {}

  static readonly STANDARD = new BasemapType(
    "std",
    "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
    "国土地理院",
    18,
    "標準地図",
    "🗺️"
  );

  static readonly PALE = new BasemapType(
    "pale",
    "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    "国土地理院",
    18,
    "淡色地図",
    "🌫️"
  );

  static create(type: string): Result<BasemapType> {
    const basemapMap = {
      std: BasemapType.STANDARD,
      pale: BasemapType.PALE,
      blank: BasemapType.BLANK,
      photo: BasemapType.PHOTO,
    };

    const basemap = basemapMap[type as keyof typeof basemapMap];
    if (!basemap) {
      return Result.fail(`Invalid basemap type: ${type}`);
    }

    return Result.ok(basemap);
  }

  getUrl(): string {
    return this.url;
  }

  getAttribution(): string {
    return this.attribution;
  }
}
```

## ベストプラクティス

### 1. パフォーマンス最適化

- 地理データの解像度を用途に応じて選択
- R2キャッシュを活用したデータ取得の最適化
- 遅延読み込みによる初期表示の高速化

### 2. アクセシビリティ

- 色覚異常者への配慮（色以外の視覚的手がかり）
- スクリーンリーダー対応
- キーボードナビゲーション対応

### 3. レスポンシブデザイン

- デバイスサイズに応じた表示最適化
- タッチデバイス対応
- モバイルファーストの設計

### 4. データ品質管理

- 地理データの整合性チェック
- 統計値の妥当性検証
- エラーハンドリングの充実

## 関連ドメイン

- **Analytics ドメイン**: 統計データの分析結果の可視化
- **Area Management ドメイン**: 地域情報の取得
- **Data Integration ドメイン**: 地理データの取得とキャッシュ

---

**更新履歴**:

- 2025-01-20: 初版作成
