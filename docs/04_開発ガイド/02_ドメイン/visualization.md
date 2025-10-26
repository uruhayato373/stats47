---
title: Visualization（可視化）ドメイン完全ガイド
created: 2025-10-26
updated: 2025-01-26
status: published
tags:
  - stats47
  - domain/visualization
  - complete-guide
author: 開発チーム
version: 3.0.0
---

# Visualization（可視化）ドメイン完全ガイド

## 目次

1. [概要・責任](#概要責任)
2. [ユビキタス言語](#ユビキタス言語)
3. [境界づけられたコンテキスト](#境界づけられたコンテキスト)
4. [エンティティ設計](#エンティティ設計)
5. [関連ドキュメント](#関連ドキュメント)

---

# 概要・責任

## ドメインの責任

可視化（Visualization）ドメインは、Stats47 プロジェクトのコアドメインの一つです。統計データを視覚的に表現し、ユーザーが直感的に理解できるようにします。

### 主な責務

1. **データの視覚化**: 統計データを適切な視覚的表現に変換
2. **インタラクティブ性**: ユーザーがデータを探索できる機能提供
3. **レスポンシブ対応**: 様々なデバイスでの適切な表示
4. **アクセシビリティ**: 全てのユーザーが利用可能な設計
5. **データソース表記**: 適切な出典表示

## ドメインの価値

可視化ドメインは、Stats47 プロジェクトの競争優位性を生み出す中核機能です：

1. **直感的理解**: 複雑な統計データを直感的に理解可能
2. **インタラクティブ探索**: ユーザーがデータを能動的に探索
3. **多様な表現**: 様々な可視化手法でデータを表現
4. **アクセシブル**: 全てのユーザーが利用可能
5. **レスポンシブ**: あらゆるデバイスで最適な表示

---

# ユビキタス言語

## 基本概念

- **ダッシュボード**: 統計データの総合的な表示画面
- **チャート**: 統計データの図表表現
- **地図**: 地理的な統計データの可視化
- **コロプレス地図**: 地域別の統計値を色分けで表示
- **ベースマップ**: 地図の背景となる地理情報
- **可視化設定**: 表示方法やスタイルの設定

## チャート関連

- **棒グラフ**: カテゴリ別の値を棒の高さで表現
- **折れ線グラフ**: 時系列データの変化を線で表現
- **円グラフ**: 全体に対する割合を円の扇形で表現
- **散布図**: 2 つの変数の関係を点で表現
- **ヒートマップ**: 2 次元データを色の濃淡で表現

## 地図関連

- **コロプレス地図**: 地域別の統計値を色分けで表示
- **ベースマップ**: 地図の背景となる地理情報
- **タイルレイヤー**: 地図の背景タイル
- **地理データ**: 行政区域などの地理情報
- **代表点**: 地域の代表的な座標点

---

# 境界づけられたコンテキスト

## 含まれるもの

- データの視覚的表現ロジック
- チャート・地図の描画ロジック
- インタラクティブ機能の実装
- レスポンシブ表示の制御
- アクセシビリティ機能

## 含まれないもの

- 統計データの分析・計算（Analytics ドメイン）
- データの取得・永続化（DataIntegration ドメイン）
- 地域情報の管理（Area ドメイン）
- カテゴリ情報の管理（Category ドメイン）

## 他ドメインとの関係性

### 依存関係

- **Analytics ドメイン**: 分析結果の取得
- **Area ドメイン**: 地域情報の取得
- **Category ドメイン**: カテゴリ情報の取得
- **DataIntegration ドメイン**: 地理データの取得

### 提供するサービス

- **Export ドメイン**: 可視化結果のエクスポート
- **Content ドメイン**: 可視化結果のコンテンツ化

---

# エンティティ設計

## 主要エンティティ

### Dashboard（ダッシュボード）

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

  getDashboardId(): DashboardId {
    return this.dashboardId;
  }

  getTitle(): string {
    return this.title;
  }

  addWidget(widget: Widget): void {
    this.widgets.push(widget);
    this.updatedAt = new Date();
  }

  removeWidget(widgetId: WidgetId): void {
    this.widgets = this.widgets.filter(
      (widget) => !widget.getWidgetId().equals(widgetId)
    );
    this.updatedAt = new Date();
  }

  updateLayout(layout: Layout): void {
    this.layout = layout;
    this.updatedAt = new Date();
  }
}
```

### Chart（チャート）

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
    private readonly isInteractive: boolean
  ) {}

  getChartId(): ChartId {
    return this.chartId;
  }

  updateData(data: ChartData): void {
    this.data = data;
  }

  updateConfig(config: ChartConfig): void {
    this.config = config;
  }
}
```

### Map（地図）

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
    private readonly isInteractive: boolean
  ) {}

  updateStatisticalData(data: MapStatisticalData): void {
    this.statisticalData = data;
  }

  updateColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }
}
```

### Widget（ウィジェット）

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
    private readonly isVisible: boolean
  ) {}

  updatePosition(position: Position): void {
    this.position = position;
  }

  setVisible(visible: boolean): void {
    this.isVisible = visible;
  }
}
```

### VisualizationConfig（可視化設定）

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
    private readonly isDefault: boolean
  ) {}

  updateSetting(key: string, value: any): void {
    this.settings.set(key, value);
  }

  updateTheme(theme: Theme): void {
    this.theme = theme;
  }
}
```

## エンティティの関係性

- **Dashboard** は **Widget** の親エンティティ
- **Widget** は **Chart** または **Map** を参照
- **Chart** は **RankingKey** と **AreaCode** を参照
- **Map** は **GeoData** と **MapStatisticalData** を参照
- **VisualizationConfig** は全ての可視化エンティティで共有

## ビジネスルール

1. **Dashboard** は最低 1 つの Widget を持つ必要がある
2. **Chart** のデータは有効な統計データである必要がある
3. **Map** の地理データと統計データは整合性がある必要がある
4. **Widget** の位置は重複してはいけない
5. **VisualizationConfig** は有効な設定値を持つ必要がある

---

# 関連ドキュメント

- [DDD ドメイン分類 - 可視化ドメイン](../../../01_技術設計/03_ドメイン設計/DDDドメイン分類.md#可視化ドメイン)
