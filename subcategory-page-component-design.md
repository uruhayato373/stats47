# サブカテゴリページ コンポーネント設計書

## 📋 概要

サブカテゴリページ（`/[category]/[subcategory]`）で、データの性質やユーザーのニーズに応じて最適な可視化コンポーネントを動的に表示するための設計書です。

## 🎯 設計目標

- **柔軟性**: データ種別に応じた最適な可視化の選択
- **再利用性**: コンポーネントの組み合わせによる効率的な開発
- **拡張性**: 新しい可視化手法の追加が容易
- **ユーザビリティ**: 直感的で理解しやすいデータ表示

## 🏗️ アーキテクチャ概要

```
SubcategoryPage
├── PageHeader (共通ヘッダー)
├── DataControls (年度選択・設定)
├── VisualizationContainer (可視化メインエリア)
│   ├── PrimaryVisualization (メイン表示)
│   │   ├── ChoroplethMapView
│   │   ├── BarChartDashboard
│   │   ├── TimeSeriesChart
│   │   └── ComparisonDashboard
│   └── SecondaryVisualization (補助表示)
│       ├── DataTable
│       ├── SummaryCards
│       ├── RankingList
│       └── StatisticsPanel
└── PageFooter (データソース・更新日時)
```

## 📊 可視化コンポーネントの種類

### 1. ChoroplethMapView（コロプレス地図）
**適用データ**: 都道府県別の数値データ、割合データ

```typescript
interface ChoroplethMapViewProps {
  data: PrefectureData[];
  colorScheme: string;
  valueFormat: 'number' | 'percentage' | 'currency';
  interactiveTooltip: boolean;
  legendPosition: 'bottom' | 'right';
}
```

**特徴**:
- D3.js + TopoJSON による日本地図の描画
- データ値に応じた色の濃淡表示
- ホバー時の詳細情報表示
- 地域クリック時のドリルダウン

**使用例**: 人口、所得、面積、犯罪率など

---

### 2. BarChartDashboard（棒グラフダッシュボード）
**適用データ**: ランキング形式で表示したいデータ

```typescript
interface BarChartDashboardProps {
  data: RankingData[];
  sortOrder: 'asc' | 'desc';
  showTop?: number;
  horizontalLayout: boolean;
  compareMode: boolean;
}
```

**特徴**:
- 都道府県別の横棒グラフ
- 上位・下位のハイライト表示
- 複数年度の比較表示
- クリック時の詳細表示

**使用例**: GDP、人口密度、賃金、企業数など

---

### 3. TimeSeriesChart（時系列チャート）
**適用データ**: 時間経過による変化を見たいデータ

```typescript
interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  selectedPrefectures: string[];
  chartType: 'line' | 'area' | 'bar';
  showTrend: boolean;
  forecastPeriod?: number;
}
```

**特徴**:
- 複数都道府県の時系列比較
- トレンドライン表示
- 季節調整・予測表示
- インタラクティブなデータポイント

**使用例**: 人口推移、経済指標、気温変化など

---

### 4. ComparisonDashboard（比較ダッシュボード）
**適用データ**: 複数指標の相関や関係性を見たいデータ

```typescript
interface ComparisonDashboardProps {
  primaryData: CategoryData;
  secondaryData?: CategoryData;
  comparisonType: 'scatter' | 'bubble' | 'correlation';
  enableRegression: boolean;
}
```

**特徴**:
- 散布図による相関分析
- バブルチャートによる3次元比較
- 回帰線・相関係数表示
- 外れ値の検出・ハイライト

**使用例**: 所得vs教育、人口vs GDP、気温vs農業生産など

---

## 🧩 補助コンポーネント

### 1. DataTable（データテーブル）
```typescript
interface DataTableProps {
  data: any[];
  columns: ColumnConfig[];
  sortable: boolean;
  filterable: boolean;
  exportable: boolean;
  pagination: boolean;
}
```

### 2. SummaryCards（サマリーカード）
```typescript
interface SummaryCardsProps {
  metrics: MetricCard[];
  layout: 'horizontal' | 'grid';
  showTrends: boolean;
}
```

### 3. RankingList（ランキングリスト）
```typescript
interface RankingListProps {
  data: RankingItem[];
  showTop: number;
  highlightCurrent?: string;
  showChange: boolean;
}
```

### 4. StatisticsPanel（統計パネル）
```typescript
interface StatisticsPanelProps {
  data: number[];
  showDistribution: boolean;
  includeOutliers: boolean;
  statisticsLevel: 'basic' | 'advanced';
}
```

## 🎨 レイアウトパターン

### パターン1: コロプレス中心レイアウト
```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│ Data Controls              │ Summary    │
├─────────────────────────────────────────┤
│                            │            │
│     Choropleth Map         │  Ranking   │
│                            │   List     │
│                            │            │
├─────────────────────────────────────────┤
│           Data Table                    │
└─────────────────────────────────────────┘
```

### パターン2: ダッシュボードレイアウト
```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│ Summary Cards (3-4 metrics)            │
├─────────────────────────────────────────┤
│ Bar Chart Dashboard │ Time Series Chart │
├─────────────────────────────────────────┤
│           Statistics Panel              │
└─────────────────────────────────────────┘
```

### パターン3: 比較分析レイアウト
```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│ Comparison Controls                     │
├─────────────────────────────────────────┤
│                            │            │
│   Comparison Dashboard     │ Statistics │
│   (Scatter/Bubble Chart)   │   Panel    │
│                            │            │
├─────────────────────────────────────────┤
│           Detailed Data Table           │
└─────────────────────────────────────────┘
```

## ⚙️ 動的コンポーネント選択ロジック

### 1. データ型による自動選択
```typescript
function getOptimalVisualization(subcategory: SubcategoryData): VisualizationType {
  const { dataType, visualizationHint, unit } = subcategory;

  // 地理的データは基本的にコロプレス地図
  if (dataType === 'geographical' || unit.includes('都道府県')) {
    return 'choropleth';
  }

  // ランキング性の高いデータは棒グラフ
  if (dataType === 'ranking' || visualizationHint === 'ranking') {
    return 'barChart';
  }

  // 時系列データは線グラフ
  if (dataType === 'timeSeries' || unit.includes('年度')) {
    return 'timeSeries';
  }

  // 相関分析が期待されるデータは散布図
  if (visualizationHint === 'correlation') {
    return 'comparison';
  }

  // デフォルトはコロプレス地図
  return 'choropleth';
}
```

### 2. ユーザー設定による切り替え
```typescript
interface VisualizationSettings {
  primaryView: VisualizationType;
  secondaryView?: VisualizationType;
  layout: LayoutType;
  showStatistics: boolean;
  enableComparison: boolean;
}
```

## 🔧 実装方針

### 1. コンポーネント構造
```typescript
// メインページコンポーネント
const SubcategoryPage = ({ category, subcategory }) => {
  const visualizationType = getOptimalVisualization(subcategory);
  const [settings, setSettings] = useVisualizationSettings();

  return (
    <PageLayout>
      <PageHeader category={category} subcategory={subcategory} />
      <DataControls settings={settings} onSettingsChange={setSettings} />
      <VisualizationContainer
        type={visualizationType}
        data={data}
        settings={settings}
      />
    </PageLayout>
  );
};
```

### 2. 可視化コンテナ
```typescript
const VisualizationContainer = ({ type, data, settings }) => {
  const renderPrimaryVisualization = () => {
    switch (type) {
      case 'choropleth':
        return <ChoroplethMapView {...props} />;
      case 'barChart':
        return <BarChartDashboard {...props} />;
      case 'timeSeries':
        return <TimeSeriesChart {...props} />;
      case 'comparison':
        return <ComparisonDashboard {...props} />;
      default:
        return <ChoroplethMapView {...props} />;
    }
  };

  return (
    <div className="visualization-container">
      <div className="primary-view">
        {renderPrimaryVisualization()}
      </div>
      {settings.showSecondary && (
        <div className="secondary-view">
          <DataTable data={data} />
          <StatisticsPanel data={data.values} />
        </div>
      )}
    </div>
  );
};
```

### 3. 設定管理
```typescript
// atoms/visualization.ts
export const visualizationSettingsAtom = atom<VisualizationSettings>({
  primaryView: 'choropleth',
  layout: 'split',
  showStatistics: true,
  enableComparison: false,
});

export const visualizationDataAtom = atom<VisualizationData | null>(null);
```

## 📱 レスポンシブ対応

### デスクトップ (1024px+)
- 2カラムレイアウト
- すべてのコンポーネントを同時表示
- インタラクティブな操作を重視

### タブレット (768px - 1023px)
- 1カラムレイアウト
- タブ切り替えによる表示切り替え
- タッチ操作対応

### モバイル (767px以下)
- カード形式の縦積みレイアウト
- スワイプによるナビゲーション
- 最小限の情報表示

## 🔄 実装優先度

### Phase 1: 基本実装
1. ✅ ChoroplethMapView（既存）
2. 🔲 基本的なDataTable
3. 🔲 シンプルなSummaryCards
4. 🔲 動的コンポーネント選択

### Phase 2: 拡張実装
1. 🔲 BarChartDashboard
2. 🔲 TimeSeriesChart
3. 🔲 StatisticsPanel
4. 🔲 レイアウト切り替え機能

### Phase 3: 高度な機能
1. 🔲 ComparisonDashboard
2. 🔲 データエクスポート機能
3. 🔲 カスタムビューの保存
4. 🔲 AI による推奨ビュー

## 🎯 期待される効果

### ユーザー体験の向上
- データの性質に最適化された表示
- 直感的で理解しやすいインターフェース
- 多様な分析ニーズへの対応

### 開発効率の向上
- 再利用可能なコンポーネント設計
- 設定駆動による柔軟なカスタマイズ
- 段階的な機能拡張が可能

### データ活用の促進
- 複数の視点からのデータ分析
- インタラクティブな探索的分析
- 専門知識不要のデータ理解

---

この設計により、各サブカテゴリページでデータの特性を活かした最適な可視化を提供し、ユーザーが統計データをより深く理解できるプラットフォームを構築できます。