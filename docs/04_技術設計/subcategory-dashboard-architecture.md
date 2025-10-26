---
title: サブカテゴリダッシュボード効率化設計
created: 2025-10-26
updated: 2025-10-26
tags:
  - アーキテクチャ
  - ダッシュボード
  - D1
  - R2
  - 効率化
---

# サブカテゴリダッシュボード効率化設計

## 1. 現状の課題

### 1.1 問題点

現在のサブカテゴリダッシュボード実装には以下の課題があります：

**コードの冗長性と肥大化**
- `src/components/pages/subcategories`内に100以上のサブカテゴリディレクトリが存在
- 各サブカテゴリごとに`[Name]NationalDashboard.tsx`と`[Name]PrefectureDashboard.tsx`を個別作成
- モックデータを使用した類似コードの繰り返し
- 新しいサブカテゴリ追加時に2つのコンポーネントファイルを毎回作成する必要がある

**保守性の低下**
- 共通のレイアウトやウィジェットの変更が全ファイルに影響
- コンポーネント間の一貫性を保つのが困難
- バグ修正や機能追加が非効率

**スケーラビリティの問題**
- サブカテゴリが増えるごとにファイル数が2倍に増加
- ビルドサイズの肥大化
- 開発速度の低下

### 1.2 現在のディレクトリ構造例

```
src/components/pages/subcategories/
├── agriculture/
│   └── agricultural-household/
│       ├── AgriculturalHouseholdNationalDashboard.tsx
│       └── AgriculturalHouseholdPrefectureDashboard.tsx
├── tourism/
│   └── tourism-accommodation/
│       ├── TourismAccommodationNationalDashboard.tsx
│       └── TourismAccommodationPrefectureDashboard.tsx
├── economy/
│   ├── business-activity/
│   ├── household-economy/
│   ├── consumer-price-difference-index/
│   └── worker-household-income/
└── [100以上のサブカテゴリディレクトリ...]
```

## 2. 提案する設計方針

### 2.1 基本コンセプト

**データ駆動アプローチ + ウィジェットシステム**

ハードコードされたコンポーネントの代わりに、データベース（D1）とストレージ（R2）を活用した動的ダッシュボード生成システムを構築します。

### 2.2 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│              Dynamic Dashboard System                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   D1 Database │    │  R2 Storage  │    │  Config  │ │
│  │              │    │              │    │   JSON   │ │
│  │ ・Dashboard  │    │ ・Templates  │    │          │ │
│  │   Configs    │    │ ・Widgets    │    │categories│ │
│  │ ・Widget     │    │ ・Themes     │    │   .json  │ │
│  │   Metadata   │    │              │    │          │ │
│  └──────┬───────┘    └──────┬───────┘    └────┬─────┘ │
│         │                   │                 │        │
│         └───────────┬───────┴─────────────────┘        │
│                     ▼                                   │
│         ┌─────────────────────────┐                    │
│         │  DashboardResolver      │                    │
│         │  (Config Loader)        │                    │
│         └───────────┬─────────────┘                    │
│                     ▼                                   │
│         ┌─────────────────────────┐                    │
│         │  DynamicDashboard       │                    │
│         │  (Main Component)       │                    │
│         └───────────┬─────────────┘                    │
│                     ▼                                   │
│         ┌─────────────────────────┐                    │
│         │  WidgetRenderer         │                    │
│         │  - MetricCard           │                    │
│         │  - ChartWidget          │                    │
│         │  - TableWidget          │                    │
│         │  - MapWidget            │                    │
│         │  - CustomWidget         │                    │
│         └─────────────────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 3. データベース設計（D1）

### 3.1 テーブル構造

#### dashboard_configs テーブル

ダッシュボードの基本設定を保存します。

```sql
CREATE TABLE dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,        -- categories.jsonのサブカテゴリID
  area_type TEXT NOT NULL,             -- 'national' または 'prefecture'
  layout_type TEXT NOT NULL,           -- 'grid', 'stacked', 'custom'
  version INTEGER DEFAULT 1,           -- バージョン管理
  is_active INTEGER DEFAULT 1,         -- アクティブフラグ
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, area_type)
);

-- インデックス
CREATE INDEX idx_dashboard_subcategory ON dashboard_configs(subcategory_id);
CREATE INDEX idx_dashboard_active ON dashboard_configs(is_active);
```

#### dashboard_widgets テーブル

各ダッシュボードに配置されるウィジェットを定義します。

```sql
CREATE TABLE dashboard_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_config_id INTEGER NOT NULL,
  widget_type TEXT NOT NULL,           -- 'metric', 'chart', 'table', 'map', 'custom'
  widget_key TEXT NOT NULL,            -- ウィジェット識別子
  position_row INTEGER NOT NULL,       -- グリッド行位置
  position_col INTEGER NOT NULL,       -- グリッド列位置
  width INTEGER DEFAULT 1,             -- 横幅（グリッド単位）
  height INTEGER DEFAULT 1,            -- 高さ（グリッド単位）
  config_json TEXT,                    -- ウィジェット固有の設定（JSON）
  data_source_type TEXT,               -- 'ranking', 'estat', 'custom'
  data_source_key TEXT,                -- データソース識別子
  display_order INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_config_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_widget_dashboard ON dashboard_widgets(dashboard_config_id);
CREATE INDEX idx_widget_position ON dashboard_widgets(position_row, position_col);
```

#### widget_templates テーブル

再利用可能なウィジェットテンプレートを保存します。

```sql
CREATE TABLE widget_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  default_config_json TEXT,            -- デフォルト設定（JSON）
  description TEXT,
  category TEXT,                       -- テンプレートのカテゴリ
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_template_key ON widget_templates(template_key);
CREATE INDEX idx_template_category ON widget_templates(category);
```

### 3.2 データ構造例

#### dashboard_configs のサンプルデータ

```json
{
  "id": 1,
  "subcategory_id": "agricultural-household",
  "area_type": "national",
  "layout_type": "grid",
  "version": 1,
  "is_active": 1
}
```

#### dashboard_widgets のサンプルデータ

```json
{
  "id": 1,
  "dashboard_config_id": 1,
  "widget_type": "metric",
  "widget_key": "total-households",
  "position_row": 0,
  "position_col": 0,
  "width": 1,
  "height": 1,
  "config_json": {
    "title": "農業経営体数",
    "unit": "経営体",
    "icon": "TrendingUp",
    "color": "teal",
    "showTrend": true,
    "decimalPlaces": 0
  },
  "data_source_type": "ranking",
  "data_source_key": "agricultural-household-count",
  "display_order": 1,
  "is_visible": 1
}
```

```json
{
  "id": 2,
  "dashboard_config_id": 1,
  "widget_type": "chart",
  "widget_key": "household-trend",
  "position_row": 1,
  "position_col": 0,
  "width": 2,
  "height": 1,
  "config_json": {
    "title": "農業経営体数の推移",
    "chartType": "line",
    "showGrid": true,
    "showLegend": true,
    "xAxisKey": "year",
    "yAxisKey": "value",
    "colorScheme": "teal"
  },
  "data_source_type": "estat",
  "data_source_key": "0003410379",
  "display_order": 2,
  "is_visible": 1
}
```

## 4. R2ストレージ設計

### 4.1 ディレクトリ構造

```
stats47/dashboard-templates/
├── layouts/
│   ├── grid-3col.json              # 3列グリッドレイアウト
│   ├── stacked.json                # 縦積みレイアウト
│   └── custom/
│       └── [subcategory-id].json   # カスタムレイアウト
├── widgets/
│   ├── metric-templates/
│   │   ├── basic-metric.json
│   │   ├── trend-metric.json
│   │   └── comparison-metric.json
│   ├── chart-templates/
│   │   ├── line-chart.json
│   │   ├── bar-chart.json
│   │   └── area-chart.json
│   └── custom/
│       └── [widget-key].json
└── themes/
    ├── default.json
    ├── minimal.json
    └── [category-id].json          # カテゴリ別テーマ
```

### 4.2 テンプレート例

#### レイアウトテンプレート（grid-3col.json）

```json
{
  "version": "1.0",
  "layout_type": "grid",
  "grid_config": {
    "columns": 3,
    "gap": "1rem",
    "responsive": {
      "mobile": { "columns": 1 },
      "tablet": { "columns": 2 },
      "desktop": { "columns": 3 }
    }
  },
  "sections": [
    {
      "id": "metrics",
      "title": "主要指標",
      "grid_area": "1 / 1 / 2 / 4",
      "widget_slots": 3
    },
    {
      "id": "chart",
      "title": "データ推移",
      "grid_area": "2 / 1 / 3 / 4",
      "widget_slots": 1
    },
    {
      "id": "table",
      "title": "詳細データ",
      "grid_area": "3 / 1 / 4 / 4",
      "widget_slots": 1
    }
  ]
}
```

#### ウィジェットテンプレート（trend-metric.json）

```json
{
  "version": "1.0",
  "widget_type": "metric",
  "template_name": "Trend Metric Card",
  "description": "メトリック値とトレンドを表示するカード",
  "default_config": {
    "showTrend": true,
    "showComparison": true,
    "comparisonPeriod": "year",
    "icon": "TrendingUp",
    "color": "blue",
    "decimalPlaces": 1,
    "formatting": {
      "thousandsSeparator": true,
      "prefix": "",
      "suffix": ""
    }
  },
  "required_data_fields": ["value", "previousValue", "trend"],
  "component_path": "widgets/MetricCard/TrendMetricCard"
}
```

## 5. コンポーネント設計

### 5.1 主要コンポーネント

#### DynamicDashboard（メインコンポーネント）

```typescript
// src/components/organisms/dashboard/DynamicDashboard.tsx

interface DynamicDashboardProps {
  subcategoryId: string;
  areaCode: string;
  areaType: 'national' | 'prefecture';
}

export function DynamicDashboard({
  subcategoryId,
  areaCode,
  areaType
}: DynamicDashboardProps) {
  // 1. ダッシュボード設定を取得
  const { config, widgets, loading, error } = useDashboardConfig(
    subcategoryId,
    areaType
  );

  // 2. レイアウトテンプレートを取得
  const layout = useDashboardLayout(config?.layout_type);

  // 3. データを取得
  const data = useDashboardData(widgets, areaCode);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} />;

  return (
    <div className="dynamic-dashboard">
      <DashboardLayout layout={layout}>
        {widgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            data={data[widget.widget_key]}
            position={{
              row: widget.position_row,
              col: widget.position_col,
              width: widget.width,
              height: widget.height
            }}
          />
        ))}
      </DashboardLayout>
    </div>
  );
}
```

#### DashboardResolver（設定解決）

```typescript
// src/infrastructure/dashboard/resolver.ts

export class DashboardResolver {
  /**
   * ダッシュボード設定をD1から取得
   */
  static async getDashboardConfig(
    db: D1Database,
    subcategoryId: string,
    areaType: 'national' | 'prefecture'
  ): Promise<DashboardConfig | null> {
    const result = await db
      .prepare(
        `SELECT * FROM dashboard_configs
         WHERE subcategory_id = ? AND area_type = ? AND is_active = 1`
      )
      .bind(subcategoryId, areaType)
      .first();

    return result as DashboardConfig | null;
  }

  /**
   * ウィジェット定義を取得
   */
  static async getDashboardWidgets(
    db: D1Database,
    dashboardConfigId: number
  ): Promise<DashboardWidget[]> {
    const result = await db
      .prepare(
        `SELECT * FROM dashboard_widgets
         WHERE dashboard_config_id = ? AND is_visible = 1
         ORDER BY display_order ASC`
      )
      .bind(dashboardConfigId)
      .all();

    return result.results as DashboardWidget[];
  }

  /**
   * R2からレイアウトテンプレートを取得
   */
  static async getLayoutTemplate(
    r2: R2Bucket,
    layoutType: string
  ): Promise<LayoutTemplate> {
    const key = `dashboard-templates/layouts/${layoutType}.json`;
    const object = await r2.get(key);

    if (!object) {
      throw new Error(`Layout template not found: ${layoutType}`);
    }

    const text = await object.text();
    return JSON.parse(text) as LayoutTemplate;
  }

  /**
   * ウィジェットテンプレートを取得
   */
  static async getWidgetTemplate(
    db: D1Database,
    templateKey: string
  ): Promise<WidgetTemplate | null> {
    const result = await db
      .prepare(
        `SELECT * FROM widget_templates WHERE template_key = ?`
      )
      .bind(templateKey)
      .first();

    return result as WidgetTemplate | null;
  }
}
```

#### WidgetRenderer（ウィジェット描画）

```typescript
// src/components/organisms/dashboard/WidgetRenderer.tsx

interface WidgetRendererProps {
  widget: DashboardWidget;
  data: any;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
}

export function WidgetRenderer({
  widget,
  data,
  position
}: WidgetRendererProps) {
  const config = JSON.parse(widget.config_json || '{}');

  // ウィジェットタイプに応じたコンポーネントを選択
  const WidgetComponent = getWidgetComponent(widget.widget_type);

  return (
    <div
      className="widget-container"
      style={{
        gridRow: `${position.row + 1} / span ${position.height}`,
        gridColumn: `${position.col + 1} / span ${position.width}`
      }}
    >
      <WidgetComponent
        data={data}
        config={config}
        dataSourceType={widget.data_source_type}
        dataSourceKey={widget.data_source_key}
      />
    </div>
  );
}

/**
 * ウィジェットタイプに応じたコンポーネントを返す
 */
function getWidgetComponent(widgetType: string): React.ComponentType<any> {
  const widgetMap: Record<string, React.ComponentType<any>> = {
    metric: MetricCardWidget,
    chart: ChartWidget,
    table: TableWidget,
    map: MapWidget,
    custom: CustomWidget
  };

  return widgetMap[widgetType] || DefaultWidget;
}
```

### 5.2 ウィジェットコンポーネント

#### MetricCardWidget（メトリックカード）

```typescript
// src/components/organisms/dashboard/widgets/MetricCardWidget.tsx

interface MetricCardWidgetProps {
  data: {
    value: number;
    previousValue?: number;
    trend?: 'up' | 'down' | 'stable';
  };
  config: {
    title: string;
    unit: string;
    icon?: string;
    color?: string;
    showTrend?: boolean;
    decimalPlaces?: number;
  };
}

export function MetricCardWidget({ data, config }: MetricCardWidgetProps) {
  const { value, previousValue, trend } = data;
  const { title, unit, icon, color, showTrend, decimalPlaces = 0 } = config;

  const formattedValue = value.toFixed(decimalPlaces);
  const change = previousValue
    ? ((value - previousValue) / previousValue) * 100
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon && <Icon name={icon} className="w-4 h-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <p className="text-xs text-muted-foreground">{unit}</p>
        {showTrend && change !== null && (
          <div className={`text-xs flex items-center gap-1 mt-2 ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendIcon direction={trend} />
            {Math.abs(change).toFixed(1)}% 前年比
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### ChartWidget（チャート）

```typescript
// src/components/organisms/dashboard/widgets/ChartWidget.tsx

interface ChartWidgetProps {
  data: Array<{ year: string; value: number }>;
  config: {
    title: string;
    chartType: 'line' | 'bar' | 'area';
    showGrid?: boolean;
    showLegend?: boolean;
    xAxisKey: string;
    yAxisKey: string;
    colorScheme?: string;
  };
}

export function ChartWidget({ data, config }: ChartWidgetProps) {
  const {
    title,
    chartType,
    showGrid = true,
    showLegend = true,
    xAxisKey,
    yAxisKey,
    colorScheme = 'blue'
  } = config;

  const ChartComponent = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart
  }[chartType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showLegend && <Legend />}
            <Tooltip />
            {/* チャートタイプに応じた描画 */}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## 6. データフロー

### 6.1 ダッシュボード表示フロー

```
1. ユーザーがサブカテゴリページにアクセス
   ↓
2. DynamicDashboard コンポーネントがマウント
   ↓
3. DashboardResolver が D1 から設定を取得
   - dashboard_configs テーブル
   - dashboard_widgets テーブル
   ↓
4. R2 からレイアウトテンプレートを取得
   ↓
5. 各ウィジェットのデータを取得
   - Ranking API (D1)
   - e-Stat API
   - カスタムデータソース
   ↓
6. WidgetRenderer が各ウィジェットを描画
   ↓
7. ダッシュボードを表示
```

### 6.2 データ取得最適化

```typescript
// src/hooks/useDashboardData.ts

export function useDashboardData(
  widgets: DashboardWidget[],
  areaCode: string
) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データソースごとにグループ化
    const groupedBySource = widgets.reduce((acc, widget) => {
      const key = `${widget.data_source_type}:${widget.data_source_key}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(widget);
      return acc;
    }, {} as Record<string, DashboardWidget[]>);

    // 並列でデータ取得
    Promise.all(
      Object.entries(groupedBySource).map(async ([key, widgets]) => {
        const [sourceType, sourceKey] = key.split(':');
        const data = await fetchDataBySource(sourceType, sourceKey, areaCode);

        // 各ウィジェットにデータを割り当て
        widgets.forEach(widget => {
          setData(prev => ({
            ...prev,
            [widget.widget_key]: data
          }));
        });
      })
    ).finally(() => setLoading(false));
  }, [widgets, areaCode]);

  return { data, loading };
}
```

## 7. 移行戦略

### 7.1 段階的移行アプローチ

#### Phase 1: 基盤構築（1-2週間）

1. **データベーススキーマ作成**
   - D1マイグレーション作成
   - テーブル作成とインデックス設定

2. **R2ストレージ構造構築**
   - ディレクトリ構造作成
   - 基本テンプレート配置

3. **コアコンポーネント開発**
   - DynamicDashboard
   - DashboardResolver
   - WidgetRenderer

#### Phase 2: ウィジェットシステム構築（2-3週間）

1. **基本ウィジェット実装**
   - MetricCardWidget
   - ChartWidget
   - TableWidget

2. **ウィジェットテンプレート作成**
   - R2にテンプレート保存
   - D1にメタデータ登録

3. **データソース統合**
   - Ranking API連携
   - e-Stat API連携

#### Phase 3: パイロット移行（1週間）

1. **パイロットサブカテゴリ選定**
   - 3-5個のサブカテゴリを選択
   - 既存コンポーネントから設定データ抽出

2. **D1/R2へのデータ移行**
   - dashboard_configs 登録
   - dashboard_widgets 登録
   - テンプレート配置

3. **動作検証**
   - 表示確認
   - パフォーマンステスト
   - A/Bテスト

#### Phase 4: 全体移行（3-4週間）

1. **バッチ移行スクリプト作成**
   - 既存コンポーネントから設定抽出
   - 自動登録スクリプト

2. **段階的移行実行**
   - カテゴリごとに移行
   - 検証とロールバック準備

3. **既存コンポーネント削除**
   - 移行完了後、旧コンポーネント削除
   - ビルドサイズ削減確認

### 7.2 後方互換性の維持

移行期間中は既存のコンポーネントとの共存を許可：

```typescript
// src/app/[category]/[subcategory]/[area]/page.tsx

export default async function SubcategoryAreaPage({
  params
}: SubcategoryAreaPageProps) {
  const { subcategory, area } = params;
  const areaType = area === 'national' ? 'national' : 'prefecture';

  // 新システムで設定が存在するか確認
  const hasDynamicConfig = await checkDashboardConfig(subcategory, areaType);

  if (hasDynamicConfig) {
    // 新しい動的ダッシュボードを使用
    return (
      <DynamicDashboard
        subcategoryId={subcategory}
        areaCode={area === 'national' ? '00000' : area}
        areaType={areaType}
      />
    );
  } else {
    // 既存のハードコードされたコンポーネントを使用（フォールバック）
    const LegacyComponent = getDashboardComponentByArea(
      subcategory,
      area === 'national' ? '00000' : area
    );
    return <LegacyComponent />;
  }
}
```

## 8. 利点と期待効果

### 8.1 開発効率の向上

**新規サブカテゴリ追加時**
- 従来: 2つのコンポーネントファイル作成（200-300行 × 2）
- 新方式: D1にレコード登録のみ（5-10レコード）
- 削減率: **90%以上のコード削減**

### 8.2 保守性の向上

**共通機能の変更時**
- 従来: 100以上のファイルを個別修正
- 新方式: 1つのウィジェットコンポーネント修正
- 削減率: **99%の修正箇所削減**

### 8.3 パフォーマンス改善

**ビルドサイズ**
- 従来: 200個のコンポーネントファイル（約500KB）
- 新方式: 10個の汎用コンポーネント + 設定データ（約50KB）
- 削減率: **90%のビルドサイズ削減**

### 8.4 スケーラビリティ

**サブカテゴリ増加への対応**
- 従来: ファイル数が線形増加（n × 2 ファイル）
- 新方式: データレコードのみ増加（一定のコンポーネント数）
- 拡張性: **無制限のスケーラビリティ**

### 8.5 柔軟性

**カスタマイズの容易さ**
- 従来: コード変更が必要
- 新方式: 設定変更のみ
- 運用: **非エンジニアでも設定変更可能**

## 9. 技術的考慮事項

### 9.1 キャッシュ戦略

```typescript
// ダッシュボード設定のキャッシュ（1時間）
const DASHBOARD_CONFIG_CACHE_TTL = 3600;

// ウィジェットデータのキャッシュ（5分）
const WIDGET_DATA_CACHE_TTL = 300;

// R2テンプレートのキャッシュ（24時間）
const TEMPLATE_CACHE_TTL = 86400;
```

### 9.2 エラーハンドリング

```typescript
// フォールバック戦略
1. D1設定取得失敗 → デフォルトレイアウト使用
2. R2テンプレート取得失敗 → ハードコードされたテンプレート使用
3. ウィジェットデータ取得失敗 → エラーウィジェット表示
4. 全体的な失敗 → 既存コンポーネントへフォールバック
```

### 9.3 パフォーマンス最適化

```typescript
// ウィジェットの遅延読み込み
const MetricCardWidget = lazy(() => import('./widgets/MetricCardWidget'));
const ChartWidget = lazy(() => import('./widgets/ChartWidget'));

// データの並列取得
const data = await Promise.all([
  fetchRankingData(),
  fetchEstatData(),
  fetchCustomData()
]);

// 仮想化による大量ウィジェット対応
<VirtualizedGrid>
  {widgets.map(widget => <WidgetRenderer ... />)}
</VirtualizedGrid>
```

## 10. 次のステップ

### 10.1 即座に着手すべきタスク

1. **D1マイグレーションファイル作成**
   - `database/migrations/XXX_create_dashboard_tables.sql`
   - テーブル作成とインデックス設定

2. **R2ディレクトリ構造構築**
   - `dashboard-templates/` 構造作成
   - 基本テンプレート配置

3. **プロトタイプ開発**
   - 1つのサブカテゴリで動作確認
   - パフォーマンス測定

### 10.2 検討事項

1. **ウィジェットライブラリの選定**
   - 既存のshadcn/uiをベースに拡張
   - カスタムウィジェットの開発方針

2. **管理UIの開発**
   - ダッシュボード設定管理画面
   - ウィジェット配置エディター
   - テンプレート管理画面

3. **テスト戦略**
   - ユニットテスト（ウィジェット単位）
   - 統合テスト（ダッシュボード全体）
   - E2Eテスト（ユーザーフロー）

## 11. まとめ

この設計により、以下を実現できます：

1. **コードの大幅削減**: 200個のコンポーネント → 10個の汎用コンポーネント
2. **開発速度の向上**: 新規追加時間を90%削減
3. **保守性の向上**: 一元管理による修正箇所の最小化
4. **スケーラビリティ**: データ駆動による無制限の拡張性
5. **柔軟性**: 設定変更のみでカスタマイズ可能

D1とR2を活用したデータ駆動アプローチにより、従来のハードコードされたコンポーネントの課題を解決し、持続可能で拡張性の高いダッシュボードシステムを構築できます。

## 関連ドキュメント

- [コンポーネント設計](../01_技術設計/05_フロントエンド設計/コンポーネント設計.md)
- [データベース設計](../01_技術設計/03_データベース設計.md)
- [R2ストレージ設計](../01_技術設計/04_ストレージ設計.md)
