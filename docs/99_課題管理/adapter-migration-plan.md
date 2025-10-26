---
title: アダプターパターン移行計画
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - refactoring
  - migration
  - adapter-pattern
---

# アダプターパターン移行計画

## 概要

現在のダッシュボードコンポーネントは直接 e-Stat API からデータを取得しており、データソースが密結合しています。この計画では、アダプターパターンを導入してデータソースを抽象化し、将来的な拡張性と保守性を向上させます。

## 現状分析

### 現在の実装状況

#### 密結合しているコンポーネント

1. **StatisticsMetricCard** (`src/components/dashboard/StatisticsMetricCard.tsx`)

   - 直接`EstatStatsDataFormatter.getAndFormatStatsData`を呼び出し
   - e-Stat API 専用のデータ構造に依存

2. **EstatLineChart** (`src/components/dashboard/LineChart/EstatLineChart.tsx`)

   - 直接`EstatStatsDataFormatter.getAndFormatStatsData`を呼び出し
   - 時系列データの変換ロジックがコンポーネント内に埋め込まれている

3. **EstatStackedBarChart** (`src/components/dashboard/StackedBarChart/index.tsx`)

   - 直接`estatAPI.getStatsData`を呼び出し
   - データ変換ロジックがコンポーネント内に存在

4. **EstatGenderDonutChart** (`src/components/dashboard/GenderDonutChart/EstatGenderDonutChart.tsx`)

   - 直接`EstatStatsDataFormatter.getAndFormatStatsData`を呼び出し
   - 性別データの変換ロジックがコンポーネント内に存在

5. **EstatPopulationPyramid** (`src/components/dashboard/PopulationPyramid/EstatPopulationPyramid.tsx`)
   - 直接`EstatStatsDataFormatter.getAndFormatStatsData`を呼び出し
   - 人口ピラミッド用のデータ変換ロジックがコンポーネント内に存在

#### 共通の問題点

- 各コンポーネントが独自のデータ取得・変換ロジックを持っている
- e-Stat API 専用のデータ構造に強く依存
- エラーハンドリングが各コンポーネントで個別実装
- テストが困難（外部 API に依存）
- 新しいデータソースの追加が困難

## 移行戦略

### Phase 1: 基盤整備（1-2 週間）

#### 1.1 共通データ構造の実装

```typescript
// src/infrastructure/dashboard/core/types.ts
export interface DashboardData {
  type: DataType;
  values: DataValue[];
  metadata: DataMetadata;
  summary?: DataSummary;
}

export interface DataValue {
  id: string;
  areaCode: string;
  areaName: string;
  categoryCode: string;
  categoryName: string;
  timeCode: string;
  timeName: string;
  value: number | null;
  unit: string;
  source: DataSource;
  metadata?: Record<string, any>;
}

// その他の型定義...
```

#### 1.2 アダプターインターフェースの実装

```typescript
// src/infrastructure/dashboard/core/interfaces.ts
export interface DataAdapter {
  readonly sourceType: string;
  readonly version: string;

  fetchData(params: AdapterParams): Promise<RawDataSourceData>;
  transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): Promise<DashboardData>;
  validate(data: RawDataSourceData): ValidationResult;
  getMetadata(params: AdapterParams): Promise<DataSourceMetadata>;
  supports(params: AdapterParams): boolean;
}
```

#### 1.3 データサービスの実装

```typescript
// src/infrastructure/dashboard/services/data-service.ts
export class DashboardDataService {
  constructor(
    private registry: AdapterRegistry,
    private cache: CacheService,
    private errorHandler: ErrorHandler
  ) {}

  async fetchData(params: AdapterParams): Promise<DashboardData> {
    // アダプター選択、データ取得、変換、キャッシュの処理
  }
}
```

### Phase 2: e-Stat API アダプターの実装（2-3 週間）

#### 2.1 e-Stat API アダプターの作成

```typescript
// src/infrastructure/dashboard/adapters/estat/estat-adapter.ts
export class EstatDataAdapter implements DataAdapter {
  readonly sourceType = "estat";
  readonly version = "1.0.0";

  async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
    // e-Stat APIからのデータ取得
  }

  async transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): Promise<DashboardData> {
    // e-Stat APIデータを共通形式に変換
  }

  // その他のメソッド実装...
}
```

#### 2.2 データ変換器の実装

```typescript
// src/infrastructure/dashboard/adapters/estat/estat-transformer.ts
export class EstatTransformer {
  transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): DashboardData {
    // e-Stat APIの複雑なデータ構造を共通形式に変換
  }
}
```

#### 2.3 データ検証器の実装

```typescript
// src/infrastructure/dashboard/adapters/estat/estat-validator.ts
export class EstatValidator {
  validate(data: RawDataSourceData): ValidationResult {
    // e-Stat APIデータの検証
  }
}
```

### Phase 3: コンポーネントの段階的移行（3-4 週間）

#### 3.1 移行対象コンポーネントの優先順位

1. **StatisticsMetricCard** (最優先)

   - 最もシンプルな構造
   - 他のコンポーネントの参考になる

2. **EstatLineChart** (高優先度)

   - 時系列データの代表例
   - 多くのコンポーネントで使用されるパターン

3. **EstatStackedBarChart** (中優先度)

   - 複数カテゴリのデータ処理
   - 積み上げグラフの特殊な要件

4. **EstatGenderDonutChart** (中優先度)

   - 構成比データの処理
   - ドーナツチャートの特殊な要件

5. **EstatPopulationPyramid** (低優先度)
   - 最も複雑なデータ変換
   - 特殊な可視化要件

#### 3.2 コンポーネント移行手順

##### Step 1: データ取得ロジックの分離

```typescript
// 移行前
export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  params,
  areaCode,
}) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await EstatStatsDataFormatter.getAndFormatStatsData(
        params.statsDataId,
        { categoryFilter: params.cdCat01 }
      );
      setData(response);
    };
    fetchData();
  }, [params]);

  // レンダリングロジック...
};

// 移行後
export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  params,
  areaCode,
}) => {
  const { data, loading, error } = useDashboardData({
    source: "estat",
    query: {
      statsDataId: params.statsDataId,
      cdCat01: params.cdCat01,
    },
    areaCode,
  });

  // レンダリングロジック...
};
```

##### Step 2: カスタムフックの実装

```typescript
// src/hooks/dashboard/useDashboardData.ts
export function useDashboardData(params: AdapterParams, areaCode?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await DashboardDataService.fetchData(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.source, JSON.stringify(params.query)]);

  return { data, loading, error };
}
```

##### Step 3: データ変換ロジックの共通化

```typescript
// src/infrastructure/dashboard/utils/data-transformers.ts
export class DashboardDataTransformer {
  static toTimeSeriesData(dashboardData: DashboardData): TimeSeriesDataPoint[] {
    // 時系列データへの変換
  }

  static toRankingData(dashboardData: DashboardData): RankingItem[] {
    // ランキングデータへの変換
  }

  static toComparisonData(dashboardData: DashboardData): ComparisonItem[] {
    // 比較データへの変換
  }
}
```

### Phase 4: テストと検証（1-2 週間）

#### 4.1 単体テストの実装

```typescript
// src/infrastructure/dashboard/adapters/estat/__tests__/estat-adapter.test.ts
describe("EstatDataAdapter", () => {
  it("should transform e-Stat data to common format", async () => {
    const adapter = new EstatDataAdapter();
    const mockData = createMockEstatData();

    const result = await adapter.transform(mockData);

    expect(result.type).toBe("timeSeries");
    expect(result.values).toHaveLength(10);
    expect(result.metadata.source.type).toBe("estat");
  });
});
```

#### 4.2 統合テストの実装

```typescript
// src/infrastructure/dashboard/__tests__/integration/data-service.test.ts
describe("DashboardDataService Integration", () => {
  it("should fetch and transform data through adapter", async () => {
    const service = new DashboardDataService(registry, cache, errorHandler);

    const result = await service.fetchData({
      source: "estat",
      query: { statsDataId: "0000010101", cdCat01: "A1101" },
    });

    expect(result).toBeDefined();
    expect(result.type).toBe("timeSeries");
  });
});
```

#### 4.3 コンポーネントテストの実装

```typescript
// src/components/dashboard/__tests__/StatisticsMetricCard.test.tsx
describe("StatisticsMetricCard", () => {
  it("should render with dashboard data", () => {
    const mockData = createMockDashboardData();

    render(
      <StatisticsMetricCard
        params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
        data={mockData}
      />
    );

    expect(screen.getByText("統計データ")).toBeInTheDocument();
  });
});
```

### Phase 5: 後方互換性の確保（1 週間）

#### 5.1 段階的移行のためのラッパー

```typescript
// src/infrastructure/dashboard/legacy/estat-legacy-adapter.ts
export class EstatLegacyAdapter {
  static async getAndFormatStatsData(
    statsDataId: string,
    options: any
  ): Promise<EstatStatsDataResponse> {
    // 既存のEstatStatsDataFormatterのラッパー
    const adapter = new EstatDataAdapter();
    const params: AdapterParams = {
      source: "estat",
      query: {
        statsDataId,
        ...options,
      },
    };

    const rawData = await adapter.fetchData(params);
    const dashboardData = await adapter.transform(rawData);

    // 既存の形式に変換して返す
    return this.convertToLegacyFormat(dashboardData);
  }
}
```

#### 5.2 設定による切り替え

```typescript
// src/infrastructure/config.ts
export const config = {
  // 既存の設定...
  dashboard: {
    useAdapterPattern: process.env.NEXT_PUBLIC_USE_DASHBOARD_ADAPTER === "true",
    fallbackToLegacy: true,
  },
};
```

## 移行スケジュール

### Week 1-2: 基盤整備

- [ ] 共通データ構造の実装
- [ ] アダプターインターフェースの実装
- [ ] データサービスの実装
- [ ] エラーハンドリングの実装

### Week 3-4: e-Stat API アダプター

- [ ] EstatDataAdapter の実装
- [ ] EstatTransformer の実装
- [ ] EstatValidator の実装
- [ ] 単体テストの実装

### Week 5-6: コンポーネント移行

- [ ] StatisticsMetricCard の移行
- [ ] EstatLineChart の移行
- [ ] カスタムフックの実装
- [ ] データ変換ユーティリティの実装

### Week 7-8: 残りコンポーネント移行

- [ ] EstatStackedBarChart の移行
- [ ] EstatGenderDonutChart の移行
- [ ] EstatPopulationPyramid の移行
- [ ] 統合テストの実装

### Week 9-10: テストと検証

- [ ] 全コンポーネントのテスト実装
- [ ] パフォーマンステスト
- [ ] エラーハンドリングテスト
- [ ] 後方互換性テスト

### Week 11-12: 後方互換性と最適化

- [ ] レガシーアダプターの実装
- [ ] 設定による切り替え機能
- [ ] パフォーマンス最適化
- [ ] ドキュメント更新

## リスク管理

### 技術リスク

#### 1. データ変換の複雑性

- **リスク**: e-Stat API の複雑なデータ構造の変換が困難
- **対策**: 段階的な実装とテスト、既存ロジックの詳細分析

#### 2. パフォーマンスの劣化

- **リスク**: アダプターレイヤーの追加によるパフォーマンス低下
- **対策**: キャッシュの活用、並列処理の最適化

#### 3. 既存機能の破綻

- **リスク**: 移行過程で既存機能が動作しなくなる
- **対策**: 後方互換性の確保、段階的移行

### プロジェクトリスク

#### 1. 開発期間の延長

- **リスク**: 予想以上の複雑性による開発期間延長
- **対策**: 段階的実装、優先順位の調整

#### 2. テストの不備

- **リスク**: 十分なテストが実施されずにバグが残る
- **対策**: 各段階でのテスト実装、自動テストの導入

## 検証項目

### 機能検証

- [ ] 既存のダッシュボード機能が正常に動作する
- [ ] 新しいデータソース（CSV、モック）が正常に動作する
- [ ] エラーハンドリングが適切に機能する
- [ ] キャッシュが正常に動作する

### パフォーマンス検証

- [ ] データ取得時間が既存と同等以下
- [ ] メモリ使用量が適切な範囲内
- [ ] キャッシュヒット率が期待値以上

### 品質検証

- [ ] コードカバレッジが 80%以上
- [ ] 型安全性が確保されている
- [ ] エラーログが適切に記録される

## ロールバック計画

### 緊急時ロールバック

1. **設定による切り替え**

   ```typescript
   // 環境変数でアダプターパターンを無効化
   NEXT_PUBLIC_USE_DASHBOARD_ADAPTER = false;
   ```

2. **レガシーアダプターの使用**

   - 既存の EstatStatsDataFormatter にフォールバック
   - 段階的な機能無効化

3. **データベースの復元**
   - 移行前の状態への復元
   - キャッシュのクリア

### 段階的ロールバック

1. **コンポーネント単位でのロールバック**

   - 問題のあるコンポーネントのみレガシー実装に戻す
   - 他のコンポーネントは新実装を維持

2. **機能単位でのロールバック**
   - 特定の機能（例：時系列グラフ）のみロールバック
   - 他の機能は新実装を維持

## 成功指標

### 技術指標

- **コードの重複率**: 30%以上削減
- **テストカバレッジ**: 80%以上
- **パフォーマンス**: 既存と同等以下
- **エラー率**: 1%以下

### ビジネス指標

- **開発効率**: 新機能開発時間 50%短縮
- **保守性**: バグ修正時間 30%短縮
- **拡張性**: 新データソース追加時間 70%短縮

## まとめ

この移行計画により、ダッシュボードのデータソース抽象化が実現され、以下の効果が期待されます：

1. **拡張性の向上**: 新しいデータソースの容易な追加
2. **保守性の向上**: データソース変更の影響を局所化
3. **テスタビリティの向上**: モックデータでのテストが容易
4. **再利用性の向上**: 共通ロジックの集約
5. **一貫性の向上**: 統一されたデータ構造とエラーハンドリング

段階的な実装により、リスクを最小化しながら確実に移行を進めることができます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
