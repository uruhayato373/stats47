# Visualization（可視化）ドメイン

## 概要

Visualization（可視化）ドメインは、stats47 プロジェクトのコアドメインの一つです。統計データを視覚的に表現し、ユーザーが直感的にデータを理解できるようにします。

### ドメインの責務と目的

1. **データの視覚化**: 統計データを適切な視覚的表現に変換
2. **インタラクティブ性**: ユーザーがデータを探索できる機能提供
3. **レスポンシブ対応**: 様々なデバイスでの適切な表示
4. **アクセシビリティ**: 全てのユーザーが利用可能な設計
5. **データソース表記**: 適切な出典表示

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (React Components, UI Controls)   │
├─────────────────────────────────────┤
│           Application Layer         │
│    (Use Cases, Services)           │
├─────────────────────────────────────┤
│            Domain Layer             │
│  (Entities, Value Objects, Rules)  │
├─────────────────────────────────────┤
│         Infrastructure Layer        │
│  (Chart Libraries, Map Libraries)  │
└─────────────────────────────────────┘
```

### 主要コンポーネント

- **Chart Engine**: 各種グラフの描画エンジン
- **Map Engine**: 地図可視化エンジン
- **Dashboard Manager**: ダッシュボード管理
- **Widget System**: ウィジェットシステム
- **Theme Engine**: テーマ・スタイル管理

## モデル設計

### エンティティ

#### Dashboard（ダッシュボード）

統計データの総合的な表示画面を表すエンティティ。

```typescript
class Dashboard {
  private constructor(
    private readonly dashboardId: DashboardId,
    private readonly title: string,
    private readonly description: string,
    private readonly layout: Layout,
    private readonly widgets: Widget[],
    private readonly areaCode: AreaCode,
    private readonly category: Category,
    private readonly subcategory: Subcategory,
    private readonly isPublic: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  // ゲッターメソッド
  getDashboardId(): DashboardId;
  getTitle(): string;
  getDescription(): string;
  getLayout(): Layout;
  getWidgets(): Widget[];
  getAreaCode(): AreaCode;
  getCategory(): Category;
  getSubcategory(): Subcategory;
  isPublic(): boolean;
  getCreatedAt(): Date;
  getUpdatedAt(): Date;

  // ビジネスメソッド
  addWidget(widget: Widget): void;
  removeWidget(widgetId: WidgetId): void;
  updateLayout(layout: Layout): void;
}
```

#### Chart（チャート）

統計データの図表表現を表すエンティティ。

```typescript
class Chart {
  private constructor(
    private readonly chartId: ChartId,
    private readonly chartType: ChartType,
    private readonly title: string,
    private readonly data: ChartData,
    private readonly config: ChartConfig,
    private readonly rankingKey: RankingKey,
    private readonly year: Year,
    private readonly areaCodes: AreaCode[],
    private readonly isInteractive: boolean,
    private readonly createdAt: Date
  ) {}

  // ゲッターメソッド
  getChartId(): ChartId;
  getChartType(): ChartType;
  getTitle(): string;
  getData(): ChartData;
  getConfig(): ChartConfig;
  getRankingKey(): RankingKey;
  getYear(): Year;
  getAreaCodes(): AreaCode[];
  isInteractive(): boolean;
  getCreatedAt(): Date;

  // ビジネスメソッド
  updateData(data: ChartData): void;
  updateConfig(config: ChartConfig): void;
  addAreaCode(areaCode: AreaCode): void;
  removeAreaCode(areaCode: AreaCode): void;
}
```

#### Map（地図）

地理的な統計データの可視化を表すエンティティ。

```typescript
class Map {
  private constructor(
    private readonly mapId: MapId,
    private readonly mapType: MapType,
    private readonly title: string,
    private readonly geoData: GeoData,
    private readonly statisticalData: MapStatisticalData,
    private readonly basemapType: BasemapType,
    private readonly colorScheme: ColorScheme,
    private readonly classificationMethod: ClassificationMethod,
    private readonly rankingKey: RankingKey,
    private readonly year: Year,
    private readonly isInteractive: boolean,
    private readonly attribution: Attribution,
    private readonly createdAt: Date
  ) {}

  // ゲッターメソッド
  getMapId(): MapId;
  getMapType(): MapType;
  getTitle(): string;
  getGeoData(): GeoData;
  getStatisticalData(): MapStatisticalData;
  getBasemapType(): BasemapType;
  getColorScheme(): ColorScheme;
  getClassificationMethod(): ClassificationMethod;
  getRankingKey(): RankingKey;
  getYear(): Year;
  isInteractive(): boolean;
  getAttribution(): Attribution;
  getCreatedAt(): Date;

  // ビジネスメソッド
  updateStatisticalData(data: MapStatisticalData): void;
  updateBasemapType(basemapType: BasemapType): void;
  updateColorScheme(colorScheme: ColorScheme): void;
  updateClassificationMethod(method: ClassificationMethod): void;
}
```

#### Widget（ウィジェット）

ダッシュボードの構成要素を表すエンティティ。

```typescript
class Widget {
  private constructor(
    private readonly widgetId: WidgetId,
    private readonly widgetType: WidgetType,
    private readonly title: string,
    private readonly position: Position,
    private readonly size: Size,
    private readonly config: WidgetConfig,
    private readonly dataSource: DataSource,
    private readonly isVisible: boolean,
    private readonly createdAt: Date
  ) {}

  // ゲッターメソッド
  getWidgetId(): WidgetId;
  getWidgetType(): WidgetType;
  getTitle(): string;
  getPosition(): Position;
  getSize(): Size;
  getConfig(): WidgetConfig;
  getDataSource(): DataSource;
  isVisible(): boolean;
  getCreatedAt(): Date;

  // ビジネスメソッド
  updatePosition(position: Position): void;
  updateSize(size: Size): void;
  updateConfig(config: WidgetConfig): void;
  setVisible(visible: boolean): void;
}
```

#### VisualizationConfig（可視化設定）

可視化の設定を表すエンティティ。

```typescript
class VisualizationConfig {
  private constructor(
    private readonly configId: ConfigId,
    private readonly configType: ConfigType,
    private readonly settings: Map<string, any>,
    private readonly theme: Theme,
    private readonly accessibility: AccessibilitySettings,
    private readonly responsive: ResponsiveSettings,
    private readonly isDefault: boolean,
    private readonly createdAt: Date
  ) {}

  // ゲッターメソッド
  getConfigId(): ConfigId;
  getConfigType(): ConfigType;
  getSettings(): Map<string, any>;
  getTheme(): Theme;
  getAccessibility(): AccessibilitySettings;
  getResponsive(): ResponsiveSettings;
  isDefault(): boolean;
  getCreatedAt(): Date;

  // ビジネスメソッド
  updateSetting(key: string, value: any): void;
  removeSetting(key: string): void;
  updateTheme(theme: Theme): void;
  updateAccessibility(accessibility: AccessibilitySettings): void;
  updateResponsive(responsive: ResponsiveSettings): void;
}
```

### 値オブジェクト

#### ChartType（チャートタイプ）

```typescript
enum ChartType {
  BAR = "bar",
  LINE = "line",
  PIE = "pie",
  SCATTER = "scatter",
  HEATMAP = "heatmap",
}
```

#### MapType（マップタイプ）

```typescript
enum MapType {
  CHOROPLETH = "choropleth",
  POINT = "point",
  HEATMAP = "heatmap",
}
```

#### WidgetType（ウィジェットタイプ）

```typescript
enum WidgetType {
  CHART = "chart",
  MAP = "map",
  TABLE = "table",
  TEXT = "text",
}
```

### 集約

#### Dashboard Aggregate

- **ルートエンティティ**: Dashboard
- **子エンティティ**: Widget[]
- **不変条件**: Dashboard は最低 1 つの Widget を持つ必要がある

#### Chart Aggregate

- **ルートエンティティ**: Chart
- **値オブジェクト**: ChartData, ChartConfig
- **不変条件**: Chart のデータは有効な統計データである必要がある

#### Map Aggregate

- **ルートエンティティ**: Map
- **値オブジェクト**: GeoData, MapStatisticalData
- **不変条件**: Map の地理データと統計データは整合性がある必要がある

## 実装パターン

### グラフ可視化

#### 棒グラフ

```typescript
class BarChartRenderer {
  render(data: ChartData, config: ChartConfig): ChartElement {
    // D3.js や Chart.js を使用した実装
    return new ChartElement({
      type: "bar",
      data: this.transformData(data),
      options: this.buildOptions(config),
    });
  }

  private transformData(data: ChartData): any {
    return {
      labels: data.labels,
      datasets: [
        {
          label: data.title,
          data: data.values,
          backgroundColor: config.colorScheme.primary,
        },
      ],
    };
  }
}
```

#### 折れ線グラフ

```typescript
class LineChartRenderer {
  render(data: ChartData, config: ChartConfig): ChartElement {
    return new ChartElement({
      type: "line",
      data: this.transformData(data),
      options: this.buildOptions(config),
    });
  }

  private transformData(data: ChartData): any {
    return {
      labels: data.timeLabels,
      datasets: [
        {
          label: data.title,
          data: data.values,
          borderColor: config.colorScheme.primary,
          fill: false,
        },
      ],
    };
  }
}
```

### 地図可視化

#### コロプレス地図

```typescript
class ChoroplethMapRenderer {
  render(geoData: GeoData, statisticalData: MapStatisticalData): MapElement {
    // Leaflet や Mapbox を使用した実装
    return new MapElement({
      type: "choropleth",
      geoData: geoData,
      statisticalData: statisticalData,
      colorScheme: this.buildColorScheme(statisticalData),
    });
  }

  private buildColorScheme(data: MapStatisticalData): ColorScheme {
    const values = data.values;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return new ColorScheme({
      type: "sequential",
      colors: ["#f7fbff", "#08306b"],
      domain: [min, max],
    });
  }
}
```

### ダッシュボード

#### ダッシュボードビルダー

```typescript
class DashboardBuilder {
  private dashboard: Dashboard;

  constructor() {
    this.dashboard = new Dashboard(
      new DashboardId(),
      "",
      "",
      new Layout(),
      [],
      new AreaCode(""),
      new Category(""),
      new Subcategory(""),
      false,
      new Date(),
      new Date()
    );
  }

  setTitle(title: string): DashboardBuilder {
    this.dashboard = this.dashboard.withTitle(title);
    return this;
  }

  addWidget(widget: Widget): DashboardBuilder {
    this.dashboard.addWidget(widget);
    return this;
  }

  setLayout(layout: Layout): DashboardBuilder {
    this.dashboard.updateLayout(layout);
    return this;
  }

  build(): Dashboard {
    this.validateDashboard();
    return this.dashboard;
  }

  private validateDashboard(): void {
    if (this.dashboard.getWidgets().length === 0) {
      throw new Error("Dashboard must have at least one widget");
    }
  }
}
```

## API 仕様

### 可視化設定 API

#### 設定取得

```typescript
GET /api/visualization/configs/{configId}

Response:
{
  "configId": "string",
  "configType": "chart|map|dashboard",
  "settings": {
    "theme": "light|dark",
    "colorScheme": "string",
    "accessibility": {
      "highContrast": boolean,
      "screenReader": boolean
    }
  }
}
```

#### 設定更新

```typescript
PUT /api/visualization/configs/{configId}

Request:
{
  "settings": {
    "theme": "dark",
    "colorScheme": "viridis"
  }
}

Response:
{
  "success": boolean,
  "configId": "string"
}
```

### データ変換 API

#### チャートデータ変換

```typescript
POST /api/visualization/transform/chart

Request:
{
  "data": {
    "rankingKey": "string",
    "areaCodes": ["string"],
    "year": number
  },
  "chartType": "bar|line|pie|scatter|heatmap"
}

Response:
{
  "chartData": {
    "labels": ["string"],
    "datasets": [{
      "label": "string",
      "data": [number],
      "backgroundColor": "string"
    }]
  }
}
```

#### 地図データ変換

```typescript
POST /api/visualization/transform/map

Request:
{
  "data": {
    "rankingKey": "string",
    "year": number
  },
  "mapType": "choropleth|point|heatmap"
}

Response:
{
  "geoData": {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": {
        "areaCode": "string",
        "value": number
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[number, number]]]
      }
    }]
  }
}
```

## テスト戦略

### 単体テスト

#### エンティティテスト

```typescript
describe("Dashboard", () => {
  it("should add widget correctly", () => {
    const dashboard = new Dashboard(/* ... */);
    const widget = new Widget(/* ... */);

    dashboard.addWidget(widget);

    expect(dashboard.getWidgets()).toContain(widget);
    expect(dashboard.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it("should not allow empty widget list", () => {
    const dashboard = new Dashboard(/* ... */);

    expect(() => {
      dashboard.removeWidget(new WidgetId("non-existent"));
    }).toThrow("Dashboard must have at least one widget");
  });
});
```

#### レンダラーテスト

```typescript
describe("BarChartRenderer", () => {
  it("should render bar chart correctly", () => {
    const renderer = new BarChartRenderer();
    const data = new ChartData(/* ... */);
    const config = new ChartConfig(/* ... */);

    const result = renderer.render(data, config);

    expect(result.type).toBe("bar");
    expect(result.data.labels).toEqual(data.labels);
  });
});
```

### 統合テスト

#### ダッシュボード統合テスト

```typescript
describe("Dashboard Integration", () => {
  it("should create dashboard with multiple widgets", async () => {
    const builder = new DashboardBuilder();
    const dashboard = builder
      .setTitle("Test Dashboard")
      .addWidget(new ChartWidget(/* ... */))
      .addWidget(new MapWidget(/* ... */))
      .build();

    const repository = new DashboardRepository();
    await repository.save(dashboard);

    const saved = await repository.findById(dashboard.getDashboardId());
    expect(saved.getWidgets()).toHaveLength(2);
  });
});
```

## ユビキタス言語

### 基本概念

- **ダッシュボード**: 統計データの総合的な表示画面
- **チャート**: 統計データの図表表現
- **地図**: 地理的な統計データの可視化
- **コロプレス地図**: 地域別の統計値を色分けで表示
- **ベースマップ**: 地図の背景となる地理情報
- **可視化設定**: 表示方法やスタイルの設定

### チャート関連

- **棒グラフ**: カテゴリ別の値を棒の高さで表現
- **折れ線グラフ**: 時系列データの変化を線で表現
- **円グラフ**: 全体に対する割合を円の扇形で表現
- **散布図**: 2 つの変数の関係を点で表現
- **ヒートマップ**: 2 次元データを色の濃淡で表現

### 地図関連

- **コロプレス地図**: 地域別の統計値を色分けで表示
- **ベースマップ**: 地図の背景となる地理情報
- **タイルレイヤー**: 地図の背景タイル
- **地理データ**: 行政区域などの地理情報
- **代表点**: 地域の代表的な座標点

## 境界づけられたコンテキスト

### 含まれるもの

- データの視覚的表現ロジック
- チャート・地図の描画ロジック
- インタラクティブ機能の実装
- レスポンシブ表示の制御
- アクセシビリティ機能

### 含まれないもの

- 統計データの分析・計算（Analytics ドメイン）
- データの取得・永続化（DataIntegration ドメイン）
- 地域情報の管理（Area ドメイン）
- カテゴリ情報の管理（Taxonomy ドメイン）

## 他ドメインとの関係性

### 依存関係

- **Ranking ドメイン**: ランキングデータの取得
- **TimeSeries ドメイン**: 時系列データの取得
- **Comparison ドメイン**: 比較データの取得
- **Area ドメイン**: 地域情報の取得
- **Taxonomy ドメイン**: カテゴリ情報の取得
- **EstatAPI ドメイン**: 統計データの取得
- **Geoshape ドメイン**: 地理データの取得

### 提供するサービス

- **Content ドメイン**: 可視化結果のコンテンツ化
- **Export ドメイン**: 可視化結果のエクスポート

## ドメインの価値

Visualization ドメインは、stats47 プロジェクトの競争優位性を生み出す中核機能です：

1. **直感的理解**: 複雑な統計データを直感的に理解可能
2. **インタラクティブ探索**: ユーザーがデータを能動的に探索
3. **多様な表現**: 様々な可視化手法でデータを表現
4. **アクセシブル**: 全てのユーザーが利用可能
5. **レスポンシブ**: あらゆるデバイスで最適な表示

## 関連ドキュメント

- [DDD ドメイン分類](../../01_システム概要/04_DDDドメイン分類.md#コアドメイン)
- [システムアーキテクチャ](../../01_システム概要/システムアーキテクチャ.md)
- [ルーティング設計](../../05_フロントエンド設計/ルーティング設計.md)
