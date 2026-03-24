# stat-charts feature（旧 dashboard）

e-Stat 統計データのチャートレンダリングエンジン。area-profile・region-comparison・ranking の 3 feature から共有される。

> **命名に関する注記**: この feature は旧 `dashboard` からリネームされました。内部のコンポーネント名（`DashboardComponentRenderer`, `DashboardGridLayout` 等）は段階的に `StatChart*` に移行中です。新規コード・修正時に揃えてください。

ダッシュボードにチャートを追加する手順リファレンス。
ローカル D1（Static DB）を直接操作して追加する。

---

## 📋 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [型定義](#型定義)
- [チャート追加手順](#チャート追加手順)
- [新規コンポーネント開発](#新規コンポーネント開発)
- [component_type リファレンス](#component_type-リファレンス)
- [テスト](#テスト)
- [トラブルシューティング](#トラブルシューティング)

---

## アーキテクチャ概要

```
dashboard_configs (1行)  ←  サブカテゴリ × エリアタイプ で 1 設定
    ↓ dashboard_id で紐付け
dashboard_components (N行)  ←  各チャート／カードの定義
    ↓ componentType + componentProps (JSON)
DashboardComponentRenderer.tsx  ←  switch で振り分け
    ↓
各コンポーネント（StatCard, LineChart, SunburstDashboardChart, ...）
    ↓ services（fetchStatData, fetchTrendData, fetchSunburstData, fetchD3BarChartRaceData）
e-Stat API からデータ取得 → 描画
```

### 主要ファイル

| ファイル | 役割 |
|:---------|:-----|
| `components/DashboardComponentRenderer.tsx` | componentType による描画振り分け（**新チャート追加時に case を追加**） |
| `types/index.ts` | 共通 Props・`DashboardConfigMap`・`DashboardItemProps` |
| `services/` | e-Stat API データ取得（fetchStatData, fetchTrendData, fetchSunburstData, fetchD3BarChartRaceData） |
| `packages/database/src/schema/dashboard.ts` | DB スキーマ（Drizzle） |
| `packages/database/src/schema/dashboard.ts` | Drizzle スキーマ（CHECK 制約に component_type の許可値） |

---

## 型定義

すべての型は **`types/index.ts`** で管理します。新規コンポーネント開発時は必ずこの型を使用してください。

### 共通型

#### DashboardChartBaseProps

全ダッシュボードチャートが共通で受け取るProps。

```typescript
/**
 * ダッシュボードチャートの共通 Props
 * 全チャートコンポーネントが持つ最小限のインターフェース
 */
export interface DashboardChartBaseProps {
  /** チャートタイトル */
  title: string;
  /** 地域コード（都道府県・市区町村・全国など） */
  areaCode: string;
  /** ランキング詳細ページへのリンク（任意） */
  rankingLink?: string | null;
  /** 説明文（任意） */
  description?: string;
}
```

#### EstatDashboardChartProps

e-Stat API でデータを取得するチャート用の共通Props。

```typescript
import type { GetStatsDataParams } from "@stats47/estat-api/server";

/**
 * e-Stat API をデータソースとするチャートの共通 Props
 */
export interface EstatDashboardChartProps extends DashboardChartBaseProps {
  /** e-Stat API の取得パラメータ（statsDataId, cdCat01 等） */
  estatParams: GetStatsDataParams;
}
```

### コンポーネント固有の型

#### StatCardProps

```typescript
export interface StatCardProps extends EstatDashboardChartProps {
  /** 表示単位（未指定時は API 応答の unit を使用） */
  unit?: string;
}
```

#### LineChartProps

```typescript
// EstatDashboardChartProps をそのまま使用
export type LineChartProps = EstatDashboardChartProps;

// または複数系列対応の場合:
export interface LineChartProps extends DashboardChartBaseProps {
  estatParams?: GetStatsDataParams;
  series?: Array<{
    label: string;
    estatParams: GetStatsDataParams;
  }>;
  description?: string;
}
```

#### SunburstDashboardChartProps

```typescript
export interface SunburstDashboardChartProps extends DashboardChartBaseProps {
  /** 統計表ID */
  statsDataId: string;
  /** ルートコード */
  rootCode: string;
  /** 子コード配列 */
  childCodes: string[];
  /** 階層グループ定義（2階層サンバースト用） */
  groups?: Array<{
    name: string;
    childCodes: string[];
  }>;
}
```

#### DashboardDataTableProps

```typescript
export interface DashboardDataTableProps extends DashboardChartBaseProps {
  /** ランキングキー */
  rankingKey: string;
  /** レイアウト用の追加クラス名 */
  className?: string;
}
```

### 型安全なレンダラー

DashboardComponentRenderer で型安全に Props を扱うため、以下の型を使用します。

```typescript
/** componentType ごとの componentProps の形 */
export type DashboardComponentPropsMap = {
  "stats-card": { estatParams: GetStatsDataParams; unit?: string };
  "line-chart": {
    estatParams?: GetStatsDataParams;
    series?: Array<{ label: string; estatParams: GetStatsDataParams }>;
    description?: string;
  };
  "sunburst": {
    statsDataId: string;
    rootCode: string;
    childCodes: string[];
    groups?: Array<{ name: string; childCodes: string[] }>;
  };
  "data-table": { rankingKey: string };
  // 他のcomponent_typeも同様に定義
};

export type DashboardComponentType = keyof DashboardComponentPropsMap;
```

---

## チャート追加手順

### 前提

- **実行場所**: `apps/web` ディレクトリ
- **対象DB**: `stats47_local_static`（Static DB）
- **必ず `--local`** を付ける

```bash
cd apps/web
npx wrangler d1 execute stats47_local_static --local --command "SQL文"
```

### Step 1: dashboard_configs の確認・追加

既存のダッシュボードにチャートを追加する場合は **Step 2 へスキップ**。
新規ダッシュボード（新しいサブカテゴリ or エリアタイプ）の場合のみ追加する。

- **id 命名規則**: `{subcategory_key}-{area_type}`
- `subcategory_key` は `subcategories` テーブルに存在する値であること

```sql
INSERT OR REPLACE INTO dashboard_configs
  (id, subcategory_key, area_type, display_name, display_order, is_active)
VALUES
  ('fiscal-indicators-national', 'fiscal-indicators', 'national',
   'fiscal-indicators (national)', 0, 1);
```

### Step 2: dashboard_components にチャートを追加

```sql
INSERT OR REPLACE INTO dashboard_components (
  id, dashboard_id, component_type, display_order,
  grid_column_span, grid_column_span_tablet, grid_column_span_sm, grid_column_span_mobile,
  title, component_props, ranking_link, is_active, data_source, chart_type
) VALUES (
  '{dashboard_id}-{チャート種別}-{識別名}',   -- id: 一意な文字列
  '{dashboard_id}',                           -- dashboard_configs.id
  '{component_type}',                         -- 下記リファレンス参照
  0,                                          -- display_order: 表示順
  12, 12, 12, 12,                             -- grid幅（通常は全幅12）
  'タイトル',
  '{"JSON形式のprops"}',                       -- 下記リファレンス参照
  NULL,                                       -- ranking_link（任意）
  1,                                          -- is_active
  'estat',                                    -- data_source
  '{chart_type}'                              -- chart_type（任意）
);
```

### Step 3: 新しい component_type を追加する場合（既存タイプなら不要）

既存の component_type を使う場合はこのステップは不要。

1. **`packages/database/src/schema/dashboard.ts`** の `componentTypeCheck` に新タイプを追加し、`npm run generate`（drizzle-kit generate）でマイグレーションを生成
2. **`components/DashboardComponentRenderer.tsx`** に新しい case を追加
3. **`types/index.ts`** の `DashboardConfigMap` に config 型を追加
4. 対応するコンポーネントを `components/` に作成
5. ローカル D1 のテーブルを再作成する必要がある場合あり（CHECK 制約変更時）

---

## 新規コンポーネント開発

既存の component_type では対応できない新しいチャートを追加する場合の手順です。

### Step 1: 型定義の追加

```typescript
// types/index.ts

// 1. コンポーネント用のProps型を定義
export interface MyNewChartProps extends DashboardChartBaseProps {
  // チャート固有のprops
  customParam: string;
  unit?: string;
}

// 2. DashboardComponentPropsMapに追加
export type DashboardComponentPropsMap = {
  // 既存のもの...
  "my-new-chart": { customParam: string; unit?: string };
};
```

### Step 2: コンポーネントの作成

```typescript
// components/charts/MyNewChart/MyNewChart.tsx

"use client";

import { useState, useEffect } from "react";
import type { MyNewChartProps } from "../../types";
import { getEstatData } from "../../actions/getEstatData";

export function MyNewChart({
  title,
  areaCode,
  customParam,
  rankingLink,
  description,
}: MyNewChartProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // データ取得ロジック
    setLoading(true);
    getEstatData({ customParam, areaCode })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [customParam, areaCode]);

  if (loading) {
    return <div className="h-64 animate-pulse bg-muted rounded-lg" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-lg">
        <p className="text-destructive">データの取得に失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {rankingLink && (
          <a href={rankingLink} className="text-sm text-primary hover:underline">
            詳細を見る →
          </a>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {/* チャート描画 */}
      <div>{/* D3.jsやRechartsなどでチャートを描画 */}</div>
    </div>
  );
}
```

### Step 3: Storybookの作成

```typescript
// components/charts/MyNewChart/MyNewChart.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { MyNewChart } from "./MyNewChart";

const meta = {
  title: "Dashboard/Charts/MyNewChart",
  component: MyNewChart,
  parameters: {
    layout: "padded",
    nextjs: {
      navigation: {
        params: { areaCode: "13000" },
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MyNewChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "新規チャート",
    areaCode: "13000",
    customParam: "test-value",
    description: "チャートの説明文",
  },
};

export const WithRankingLink: Story = {
  args: {
    ...Default.args,
    rankingLink: "/ranking/custom-data/2023",
  },
};
```

### Step 4: レンダラーへの登録

```typescript
// components/DashboardComponentRenderer.tsx

import { MyNewChart } from "./charts/MyNewChart/MyNewChart";
import type { DashboardComponentPropsMap } from "../types";

export function DashboardComponentRenderer({ component }: Props) {
  const parsedProps = JSON.parse(component.componentProps || "{}");

  switch (component.componentType) {
    // 既存のcase...

    case "my-new-chart": {
      const props = parsedProps as DashboardComponentPropsMap["my-new-chart"];
      return (
        <MyNewChart
          title={component.title}
          areaCode={component.areaCode}
          rankingLink={component.rankingLink}
          description={component.description}
          {...props}
        />
      );
    }

    default:
      return <div>Unknown component type: {component.componentType}</div>;
  }
}
```

### Step 5: DBスキーマの更新

```typescript
// packages/database/src/schema/dashboard.ts

export const componentTypeCheck = sql`
  CHECK (component_type IN (
    'stats-card',
    'line-chart',
    'sunburst',
    'my-new-chart'  -- 追加
    -- 他のタイプ...
  ))
`;
```

```bash
# マイグレーション生成
npm run generate

# ローカルDBに適用（CHECK制約変更の場合、テーブル再作成が必要）
npx wrangler d1 execute stats47_local_static --local --file=path/to/migration.sql
```

### Step 6: DBへのコンポーネント登録

```sql
INSERT OR REPLACE INTO dashboard_components (
  id,
  dashboard_id,
  component_type,
  display_order,
  grid_column_span,
  grid_column_span_tablet,
  grid_column_span_sm,
  grid_column_span_mobile,
  title,
  component_props,
  ranking_link,
  is_active,
  data_source
) VALUES (
  'fiscal-indicators-national-my-new-chart-1',
  'fiscal-indicators-national',
  'my-new-chart',
  0,
  12, 12, 12, 12,
  '新規チャートのタイトル',
  '{"customParam":"test-value","unit":"百万円"}',
  NULL,
  1,
  'estat'
);
```

### Step 7: テストの作成

```typescript
// components/charts/MyNewChart/__tests__/MyNewChart.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MyNewChart } from "../MyNewChart";
import * as actions from "../../../actions/getEstatData";

vi.mock("../../../actions/getEstatData");

describe("MyNewChart", () => {
  it("タイトルが表示される", () => {
    render(
      <MyNewChart
        title="テストチャート"
        areaCode="13000"
        customParam="test"
      />
    );

    expect(screen.getByText("テストチャート")).toBeInTheDocument();
  });

  it("データ取得成功時にチャートが表示される", async () => {
    const mockData = [{ value: 100 }];
    vi.mocked(actions.getEstatData).mockResolvedValue(mockData);

    render(
      <MyNewChart
        title="テストチャート"
        areaCode="13000"
        customParam="test"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("データの取得に失敗しました")).not.toBeInTheDocument();
    });
  });

  it("エラー時にエラーメッセージが表示される", async () => {
    vi.mocked(actions.getEstatData).mockRejectedValue(
      new Error("API Error")
    );

    render(
      <MyNewChart
        title="テストチャート"
        areaCode="13000"
        customParam="test"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
    });
  });
});
```

---

## component_type リファレンス

実装済みで DashboardComponentRenderer にて描画されるタイプの一覧。

### `stats-card` — 単一統計値カード

最新年の値を 1 つ表示する。

```json
{
  "estatParams": { "statsDataId": "0000010104", "cdCat01": "D3103" },
  "unit": "百万円"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `estatParams.statsDataId` | Yes | e-Stat 統計表ID |
| `estatParams.cdCat01` | Yes | カテゴリコード |
| `unit` | No | 表示単位（省略時は API 応答の unit） |

grid 推奨: `4, 6, 12, 12`（デスクトップは 1/3 幅 or 半分）

---

### `line-chart` — 推移折れ線チャート

時系列の折れ線グラフ。単一系列 or 複数系列。

**単一系列:**
```json
{
  "estatParams": { "statsDataId": "0000010104", "cdCat01": "D3103" },
  "description": "歳出の推移"
}
```

**複数系列（同一チャートに重ねる）:**
```json
{
  "series": [
    { "label": "都道府県財政", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D3103" } },
    { "label": "市町村財政", "estatParams": { "statsDataId": "0000010105", "cdCat01": "D3103" } }
  ],
  "description": "歳出の推移比較"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `estatParams` | series 未指定時 Yes | 単一系列の e-Stat パラメータ |
| `series` | estatParams 未指定時 Yes | 複数系列定義（label + estatParams の配列） |
| `description` | No | 説明文 |

grid 推奨: `6, 12, 12, 12` or `12, 12, 12, 12`

---

### `sunburst` — サンバーストチャート（内訳の階層表示）

```json
{
  "statsDataId": "0000010104",
  "rootCode": "D3101",
  "childCodes": ["D310101", "D310102", "D310103"],
  "description": "歳入の内訳"
}
```

**グループ化あり（2 階層）:**
```json
{
  "statsDataId": "0000010104",
  "rootCode": "D3101",
  "childCodes": ["D310101", "D310102", "D310103", "D310104", "D310105"],
  "groups": [
    { "name": "一般財源", "childCodes": ["D310101", "D310102"] },
    { "name": "特定財源", "childCodes": ["D310103", "D310104"] }
  ],
  "description": "歳入の内訳（グループ化）"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `statsDataId` | Yes | e-Stat 統計表ID |
| `rootCode` | Yes | 親カテゴリコード（合計値） |
| `childCodes` | Yes | 子カテゴリコード配列（全件を列挙） |
| `groups` | No | 階層グループ定義（2 階層サンバースト用） |
| `description` | No | 説明文 |

grid 推奨: `12, 12, 12, 12`（全幅）

---

### `treemap` — ツリーマップチャート

sunburst と同一の component_props 構造。

```json
{
  "statsDataId": "0000010104",
  "rootCode": "D3101",
  "childCodes": ["D310101", "D310102", "D310103"]
}
```

grid 推奨: `12, 12, 12, 12`

---

### `stacked-bar-chart` — 積み上げ棒グラフ

複数系列を年単位でマージし、積み上げ表示。同一 label は合算される。

```json
{
  "series": [
    { "label": "地方税", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310101" } },
    { "label": "地方交付税", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310102" } },
    { "label": "国庫支出金", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310103" } }
  ],
  "description": "歳入構成の推移",
  "unit": "百万円"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `series` | Yes | `{ label, estatParams }` の配列 |
| `description` | No | 説明文 |
| `unit` | No | 表示単位 |

grid 推奨: `12, 12, 12, 12`

---

### `category-bar-chart-with-view-toggle` / `category-bar-chart` / `bar-chart` — カテゴリ別棒グラフ

各カテゴリの最新値を棒グラフで比較表示。3 つの component_type は同一コンポーネントで描画される。

```json
{
  "series": [
    { "label": "地方税", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310101" } },
    { "label": "地方交付税", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310102" } },
    { "label": "国庫支出金", "estatParams": { "statsDataId": "0000010104", "cdCat01": "D310103" } }
  ],
  "description": "歳入項目の比較",
  "unit": "百万円",
  "enableViewToggle": true
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `series` | Yes | `{ label, estatParams }` の配列 |
| `description` | No | 説明文 |
| `unit` | No | 表示単位 |
| `enableViewToggle` | No | ビュー切替の有効化（default: false） |

grid 推奨: `12, 12, 12, 12` or `6, 12, 12, 12`

---

### `multi-stats-card` — 複合統計カード

同一統計表から複数カテゴリの値を一覧表示。

```json
{
  "statsDataId": "0000010104",
  "categories": [
    { "categoryFilter": "D310101", "label": "地方税" },
    { "categoryFilter": "D310102", "label": "地方交付税" }
  ],
  "showTotal": true,
  "totalLabel": "合計"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `statsDataId` | Yes | e-Stat 統計表ID |
| `categories` | Yes | `{ categoryFilter, label }` の配列 |
| `showTotal` | No | 合計行を表示するか（default: false） |
| `totalLabel` | No | 合計行のラベル |

grid 推奨: `4, 6, 12, 12` or `6, 12, 12, 12`

---

### `definitions-card` — 定義・説明カード

テキスト表示用（LaTeX 数式対応）。

```json
{
  "definition": "経常収支比率 = 経常経費充当一般財源 ÷ 経常一般財源総額 × 100"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `definition` | Yes | 定義テキスト（LaTeX `$...$` 対応） |

grid 推奨: `12, 12, 12, 12`

---

### `custom` + `chart_type: 'bar-chart-race'` — バーチャートレース

component_type は `custom`、chart_type カラムに `bar-chart-race` を指定。

```json
{
  "estatParams": {
    "statsDataId": "0000010104",
    "cdCat01": ["D310101", "D310102", "D310103"]
  },
  "unit": "百万円",
  "description": "歳入上位項目の推移"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `estatParams.statsDataId` | Yes | e-Stat 統計表ID |
| `estatParams.cdCat01` | Yes | カテゴリコード**配列** |
| `unit` | No | 表示単位 |
| `description` | No | 説明文 |

grid 推奨: `12, 12, 12, 12`

---

## component_type CHECK 制約の全値

`packages/database/src/schema/dashboard.ts` の CHECK 制約で許可されている値の全リスト（未実装のものも含む）:

`stats-card`, `stats-card-with-trend`, `line-chart`, `donut-chart`, `definitions-card`, `bar-chart`, `pyramid-chart`, `progress-bar`, `custom`, `affiliate-ad`, `data-table`, `playback-bar-chart`, `revenue-sunburst-chart`, `sunburst`, `stacked-bar-chart`, `category-bar-chart`, `category-bar-chart-with-year-selector`, `category-bar-chart-with-view-toggle`, `multi-trend-chart`, `multi-stats-card`, `trend-chart-with-toggle`, `gender-ratio-progress-bar`, `gender-ratio-donut-chart`, `radial-chart`, `composed-chart`, `revenue-donut-chart`, `treemap`

---

## grid_column_span 早見表

12 カラムグリッド。レスポンシブ 4 段階。

| 用途 | desktop | tablet | sm | mobile |
|:-----|:--------|:-------|:---|:-------|
| 全幅（チャート系） | 12 | 12 | 12 | 12 |
| 半幅（2 カラム並び） | 6 | 6 | 12 | 12 |
| 1/3 幅（3 カラム並び） | 4 | 6 | 12 | 12 |

---

## 注意事項

- **component_props** は有効な JSON 文字列であること。SQL のシングルクォート内でダブルクォートをエスケープする。
- **subcategory_key** は `subcategories` テーブルに存在する値のみ使用可。
- **display_order** は 0 始まりの整数。同一ダッシュボード内で昇順に並ぶ。
- **ローカル D1 の実体**: `apps/web/wrangler.toml` の `persist_to`（`../../.local/d1`）に保存される。
- 新しい component_type を CHECK 制約に追加した場合、ローカル D1 のテーブル再作成が必要になることがある。

---

## テスト

### 単体テスト (Vitest)

```bash
# 全テストの実行
npm run test

# 特定のコンポーネントのテスト
npm run test -- MyNewChart.test.tsx

# カバレッジ測定
npm run test:coverage
```

### Storybook

```bash
# Storybookの起動
npm run storybook

# ビルド
npm run build-storybook

# Storybookテストの実行
npm run test-storybook
```

### E2Eテスト

```bash
# Playwrightテストの実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui
```

---

## トラブルシューティング

### 問題1: コンポーネントが表示されない

**症状**: ダッシュボードでチャートが表示されず、エラーメッセージも出ない

**チェックポイント**:
1. `dashboard_components.is_active = 1` になっているか確認
2. `dashboard_configs.is_active = 1` になっているか確認
3. `component_props` が有効なJSON文字列か確認

```sql
-- コンポーネント設定の確認
SELECT id, component_type, is_active, component_props
FROM dashboard_components
WHERE dashboard_id = 'your-dashboard-id';
```

### 問題2: Props型エラー

**症状**: `Type 'X' is not assignable to type 'Y'`

**解決**:
```typescript
// types/index.ts で型定義を確認
// コンポーネントとレンダラーで同じ型を使用しているか確認

// ❌ 悪い例: 異なる型を使用
// components/MyChart.tsx
interface MyChartProps { /* ... */ }

// DashboardComponentRenderer.tsx
const props = parsedProps as SomeOtherType;

// ✅ 良い例: types/index.ts の型を使用
import type { MyChartProps } from "../../types";
const props = parsedProps as MyChartProps;
```

### 問題3: e-Stat APIのデータ取得失敗

**症状**: チャートに「データの取得に失敗しました」と表示される

**チェックポイント**:
1. 環境変数 `ESTAT_API_KEY` が設定されているか
2. `estatParams.statsDataId` が正しいか
3. `cdCat01` などのカテゴリコードが存在するか

```bash
# 環境変数の確認
echo $ESTAT_API_KEY

# e-Stat APIを直接叩いて確認
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=YOUR_KEY&statsDataId=0000010104"
```

### 問題4: CHECK制約エラー

**症状**: `CHECK constraint failed: dashboard_components`

**原因**: `component_type` に許可されていない値を挿入しようとした

**解決**:
1. `packages/database/src/schema/dashboard.ts` の `componentTypeCheck` に新しい値を追加
2. `npm run generate` でマイグレーション生成
3. ローカルDBを再作成または制約を削除

```bash
# 一時的に制約を無効化（開発時のみ）
npx wrangler d1 execute stats47_local_static --local --command "
  CREATE TABLE dashboard_components_new AS SELECT * FROM dashboard_components;
  DROP TABLE dashboard_components;
  ALTER TABLE dashboard_components_new RENAME TO dashboard_components;
"
```

### 問題5: Storybookでコンポーネントが動かない

**症状**: Storybookで Next.js のフックが使えない

**解決**:
```typescript
// .storybook/preview.ts
export const parameters = {
  nextjs: {
    appDirectory: true,
    navigation: {
      params: { areaCode: "13000" },
    },
  },
};

// Story内でもparametersを上書き可能
export const Default: Story = {
  parameters: {
    nextjs: {
      navigation: {
        params: { areaCode: "27000" }, // 大阪府
      },
    },
  },
};
```

### 問題6: JSON.parse エラー

**症状**: `Unexpected token in JSON at position X`

**原因**: `component_props` の JSON が不正

**デバッグ**:
```sql
-- component_propsの内容を確認
SELECT id, component_props
FROM dashboard_components
WHERE id = 'your-component-id';

-- JSONが有効か確認（PostgreSQLの場合）
SELECT id, component_props::json
FROM dashboard_components;
```

**修正例**:
```sql
-- ❌ 不正なJSON（シングルクォート使用）
'{'statsDataId':'0000010104'}'

-- ✅ 正しいJSON（ダブルクォート使用）
'{"statsDataId":"0000010104"}'
```

---

## ベストプラクティス

### 1. 型安全性の確保

```typescript
// ❌ 悪い例
const props: any = JSON.parse(component.componentProps);

// ✅ 良い例
const props = JSON.parse(component.componentProps) as DashboardComponentPropsMap["my-chart"];
```

### 2. エラーハンドリング

全てのチャートコンポーネントで一貫したエラーハンドリングを実装:

```typescript
const [error, setError] = useState<Error | null>(null);

if (error) {
  return (
    <div className="p-4 bg-destructive/10 rounded-lg">
      <p className="text-destructive">データの取得に失敗しました</p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-2 text-xs">{error.message}</pre>
      )}
    </div>
  );
}
```

### 3. ローディング状態

```typescript
if (loading) {
  return <Skeleton className="h-64 w-full" />;
}
```

### 4. メモ化

重い計算はメモ化する:

```typescript
const processedData = useMemo(() => {
  return data.map(/* 重い処理 */);
}, [data]);
```

### 5. Server Actionsのキャッシュ

```typescript
import { unstable_cache } from "next/cache";

export const getCachedEstatData = unstable_cache(
  async (params) => getStatsData(params),
  ["estat-data"],
  { revalidate: 3600 } // 1時間キャッシュ
);
```

---

## 関連ドキュメント

- **ブログ記事チャート**: [Blog Feature README](../blog/README.md) - ブログ用チャートとの違い
- **e-Stat APIパッケージ**: [packages/estat-api/README.md](../../../../packages/estat-api/README.md)
- **デザインシステム**: [デザインシステム](../../../../../docs/01_技術設計/05_フロントエンド設計/デザインシステム.md)
- **データベーススキーマ**: [packages/database/src/schema/dashboard.ts](../../../../packages/database/src/schema/dashboard.ts)

---

## 変更履歴

- 2026-02-16: 型定義セクション、新規コンポーネント開発ガイド、テスト、トラブルシューティングを追加
