# stat-charts feature（旧 dashboard）

e-Stat 統計データのチャートレンダリングエンジン。area-profile・region-comparison・ranking の 3 feature から共有される。

> **命名に関する注記**: この feature は旧 `dashboard` からリネームされました。内部のコンポーネント名（`DashboardComponentRenderer`, `DashboardGridLayout` 等）は段階的に `StatChart*` に移行中です。新規コード・修正時に揃えてください。

ダッシュボードにチャートを追加する手順リファレンス。
配置は git の JSON (`apps/web/scripts/data/page-components/`) が正本で、編集してから R2 snapshot を作り直す (完全DBレス。ローカル D1 / SQLite は 2026-11-21 までに廃止)。

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
apps/web/scripts/data/page-components/<pageType>/<key>.json  ←  ページ 1 つ = チャート／カード定義の配列 (git が正本)
    ↓ export-page-components-snapshot.ts
R2 snapshot (page-components)  ←  本番アプリはこれだけを読む
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
| `apps/web/scripts/data/page-components/<pageType>/<key>.json` | 配置の正本（pageType は `area` / `area-category` / `city-category` / `theme`） |
| `apps/web/scripts/export-page-components-snapshot.ts` | JSON → R2 snapshot の生成 |
| `apps/web/scripts/verify-page-components-snapshot.ts` | git の JSON と R2 配信の一致検証 |

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

- **正本**: `apps/web/scripts/data/page-components/<pageType>/<key>.json`（1 ファイルが 1 ページ。中身はコンポーネント定義の配列）
- 本番アプリは R2 snapshot だけを読むので、JSON を直したら snapshot を作り直す

### Step 1: 対象ページの JSON を開く

- 地域ページなら `area/<5桁の地域コード>.json`、地域×カテゴリなら `area-category/`、テーマなら `theme/` の該当ファイル
- 新しいページを足すときは同じ形のファイルを作る

### Step 2: 配列にチャートを追加する

既存の要素と同じ形の 1 件を足す。フィールドは既存ファイルに合わせる。

```json
{
  "componentKey": "area-ov-my-chart",
  "componentType": "line-chart",
  "title": "タイトル",
  "componentProps": { "estatParams": [{ "statsDataId": "0000010101", "cdCat01": "A1101" }] },
  "sourceName": "社会・人口統計体系",
  "sourceLink": null,
  "rankingLink": null,
  "gridColumnSpan": 12,
  "gridColumnSpanTablet": null,
  "gridColumnSpanSm": null,
  "dataSource": null,
  "section": "人口・世帯",
  "sortOrder": 10
}
```

### Step 3: snapshot を作り直して確認する

```bash
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js apps/web/scripts/export-page-components-snapshot.ts
npx tsx apps/web/scripts/verify-page-components-snapshot.ts
```

新しい componentType が要るときは、下の「新規コンポーネント開発」で `types/index.ts` の `DashboardConfigMap` とレンダラーに足してから使う。DB の CHECK 制約やマイグレーションは無い。

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

### Step 5: 配置の JSON に登録する

「チャート追加手順」の Step 2 と同じく、対象ページの JSON に `"componentType": "my-new-chart"` の要素を足し、Step 3 で snapshot を作り直す。
componentType の許可値は `types/index.ts` の `DashboardConfigMap` のキー (Step 1 で追加済み) で、DB の CHECK 制約は無い。

### Step 6: テストの作成

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

用語と内訳の定義を表示する。`slide-presentation` と同じ形で、config はキーだけを持ち、中身はファイルに置く。

```json
{
  "definitionSetKey": "revenue"
}
```

| プロパティ | 必須 | 説明 |
|:-----------|:-----|:-----|
| `definitionSetKey` | Yes | `data/definitions/index.ts` の `DEFINITION_REGISTRY` のキー |

定義の中身 (`DefinitionSetData`: 説明・バッジ・グループと項目・出典) は `data/definitions/<key>.ts` に書き、
`DEFINITION_REGISTRY` に登録する。`getDefinitionSet(key)` が見つけられないキーのカードは描画しない。

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

## component_type の全値

許可値の正本は `types/index.ts` の `DashboardComponentType` (= `DashboardConfigMap` のキー)。一覧はそこを読む。

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

- **componentProps** は JSON のオブジェクトで書く (文字列にしない)。
- **sortOrder** は同一ページ内で昇順に並ぶ。
- JSON を直しただけでは本番に出ない。snapshot を作り直し、R2 へ反映してから確認する。

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
1. 対象ページの JSON (`apps/web/scripts/data/page-components/<pageType>/<key>.json`) に要素があるか確認
2. snapshot を作り直したか確認 (`verify-page-components-snapshot.ts` で R2 と一致するか)
3. `componentType` が `DashboardConfigMap` のキーにあり、`DashboardComponentRenderer.tsx` に case があるか確認

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

### 問題4: Unknown component type と表示される

**原因**: JSON の `componentType` がレンダラーに登録されていない

**解決**: `types/index.ts` の `DashboardConfigMap` と `DashboardComponentRenderer.tsx` の case に追加する (DB の制約は無い)。

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

**原因**: 配置の JSON ファイルが不正

**デバッグ**:
```bash
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' apps/web/scripts/data/page-components/area/01000.json
```

**修正例**: キーと文字列はダブルクォートで書く (`{"statsDataId":"0000010104"}`)。

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

- **ブログ記事チャート**: [Blog Feature README](../../features/blog/README.md) - ブログ用チャートとの違い
- **e-Stat APIパッケージ**: [packages/estat-api/README.md](../../../../../packages/estat-api/README.md)
- **デザインシステム**: [デザインシステム](../../../../../docs/01_技術設計/04_デザインシステム.md)
- **配置の正本**: [apps/web/scripts/data/page-components/](../../../scripts/data/page-components/)

---

## 変更履歴

- 2026-02-16: 型定義セクション、新規コンポーネント開発ガイド、テスト、トラブルシューティングを追加
