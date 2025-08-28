# Organisms（有機体）

MoleculesとAtomsを組み合わせて作成される、複雑で機能的なUIコンポーネントです。

## 概要

Organismsは、複数のMoleculesとAtomsを組み合わせて作成される、より大きな機能を持つコンポーネントです。これらは特定のセクションや機能領域を担当します。

## 含まれるべきコンポーネント

- **ヘッダーナビゲーション** (`HeaderNavigation.tsx`) - Logo + Nav + UserMenu
- **統計カード** (`StatisticsCard.tsx`) - Title + Chart + Metrics
- **データテーブル** (`DataTable.tsx`) - Header + Rows + Pagination
- **フィルターパネル** (`FilterPanel.tsx`) - Search + Filters + Actions
- **ダッシュボードウィジェット** (`DashboardWidget.tsx`) - Header + Content + Actions
- **フォームセクション** (`FormSection.tsx`) - Title + Fields + Validation

## 命名規則

- ファイル名: `PascalCase.tsx` (例: `HeaderNavigation.tsx`)
- コンポーネント名: `PascalCase` (例: `HeaderNavigation`)
- フォルダ名: `kebab-case` (例: `header-navigation/`)

## 実装例

```typescript
// StatisticsCard.tsx
import { Card } from '../molecules/Card';
import { Chart } from '../molecules/Chart';
import { Metric } from '../molecules/Metric';

export interface StatisticsCardProps {
  title: string;
  data: any[];
  metrics: {
    label: string;
    value: string | number;
    change?: number;
  }[];
}

export function StatisticsCard({ title, data, metrics }: StatisticsCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <div className="mb-6">
        <Chart data={data} />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Metric
            key={index}
            label={metric.label}
            value={metric.value}
            change={metric.change}
          />
        ))}
      </div>
    </Card>
  );
}
```

## 原則

1. **機能性**: 特定の機能やセクションを担当
2. **複雑性**: 複数のMoleculesとAtomsを組み合わせ
3. **再利用性**: 同様の機能を持つ場所で使用可能
4. **独立性**: 他のOrganismsに依存しない
