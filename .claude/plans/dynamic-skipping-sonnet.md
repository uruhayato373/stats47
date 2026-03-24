# Sprint 2: ブログデータワークフロー — 実装計画

## Context

ブログ記事（MDX）で D3 チャートを使うためのデータ取得→保存→配信→描画のワークフローを構築する。
設計書: `docs/99_課題管理/ブログデータワークフロー_設計方針.md`

現状: Blog チャートラッパー（`BlogBarChart` 等）は存在するが `dataPath` からのデータ読み込みは**未実装**。`BaseChartConfig.dataPath` は型定義のみ。

---

## Step 1: 型定義 + データ取得スクリプト

### 1.1 `BlogChartDataFile<T>` 型 — `packages/types/src/blog-chart-data.ts`（新規）

```typescript
export interface BlogChartDataFile<T = unknown> {
  source: {
    type: "estat-api";
    statsDataId: string;
    params: Record<string, string | number | undefined>;
    fetchedAt: string;
  };
  chartType: "bar" | "line" | "scatterplot" | "choropleth" | "column" | "donut";
  meta: { title?: string; unit?: string; xLabel?: string; yLabel?: string };
  data: T;
}
```

`packages/types/src/index.ts` に export 追加。

> `source.params` は `Record<string, string | number | undefined>` にして `@stats47/estat-api` への依存を避ける。

### 1.2 データ取得スクリプト — `packages/estat-api/src/scripts/fetch-blog-data.ts`（新規）

CLI でe-Stat データを取得し `.local/r2/blog/<slug>/data/<file>.json` に保存。

```
npx tsx packages/estat-api/src/scripts/fetch-blog-data.ts \
  --slug "test" --statsDataId "0000020201" --chartType bar \
  --output "population.json" [--cdCat01 "..."] [--prefectureOnly] [--latestYear]
```

**パイプライン:**
1. `fetchStatsDataFromApi(params)` — API 直接（R2 不要）
2. `formatStatsData(response)` → `convertToStatsSchema()` — 純粋関数
3. `filterPrefectureData()` / `getLatestYearData()` — オプションフィルタ
4. chartType に応じた D3 ネイティブ形式への変換（スクリプト内のシンプルな map）
5. `BlogChartDataFile<T>` エンベロープでラップ → JSON 保存

**D3 データ変換**（設計書の案 C: スクリプト内簡易変換）:
- `bar`/`column`: `{ name: areaName, value, code: areaCode }`
- `line`: `{ category: yearCode, label: yearName, value }`
- `choropleth`: `{ areaCode, value }`
- `scatterplot`: エラー（2 データセット必要、手動結合を案内）

**利用する既存関数:**
- `packages/estat-api/src/stats-data/repositories/api/fetch-from-api.ts` — `fetchStatsDataFromApi`
- `packages/estat-api/src/stats-data/utils/format-stats-data.ts` — `formatStatsData`
- `packages/estat-api/src/stats-data/utils/convert-to-stats-schema.ts` — `convertToStatsSchema`
- `packages/estat-api/src/stats-data/utils/filter-prefecture-data.ts` — `filterPrefectureData`
- `packages/estat-api/src/stats-data/utils/get-latest-year-data.ts` — `getLatestYearData`

> D3 データ型はスクリプト内にインライン定義（`@stats47/visualization` は React 依存のため CLI から import 不可）

---

## Step 2: API Route — `apps/web/src/app/api/blog-data/[...path]/route.ts`（新規）

`dataPath="/api/blog-data/<slug>/data/<file>.json"` を処理する catch-all route。

- dev: `.local/r2/blog/<slug>/data/<file>.json` をローカル FS から読み込み
- prod: `fetchFromR2AsJson("blog/<slug>/data/<file>.json")` で R2 から取得

**利用する既存関数:**
- `packages/r2-storage/src/lib/operations/fetch.ts` — `fetchFromR2AsJson`

---

## Step 3: Blog チャートの dataPath 対応

### 3.1 `useChartData` hook — `apps/web/src/features/blog/hooks/useChartData.ts`（新規）

```typescript
export function useChartData<T>(dataPath?: string): {
  data: T | null; meta: BlogChartMeta | null; isLoading: boolean; error: string | null;
}
```

`dataPath` を fetch → `BlogChartDataFile<T>` エンベロープを展開 → `{ data, meta }` を返す。

### 3.2 `ChartWithFallback` 更新 — `apps/web/src/features/blog/components/charts/ChartWithFallback.tsx`

`isLoading` / `error` props 追加。ローディング中は「データを読み込み中...」表示。

### 3.3 chart-config.types 更新 — `apps/web/src/features/blog/types/chart-config.types.ts`

- `xField` / `yField` 等を optional に変更（D3 ネイティブ形式では不要）
- 各 config に `title?: string` 追加

### 3.4 Blog チャートラッパー 4 ファイル更新

`BlogBarChart`, `BlogLineChart`, `BlogScatterPlot`, `BlogChoroplethMap` すべて同パターン:

```typescript
export function BlogBarChart(props: BarChartConfig) {
  const { data, meta, isLoading, error } = useChartData<ChartDataNode[]>(props.dataPath);
  return (
    <ChartWithFallback fallbackImage={props.fallbackImage} isLoading={isLoading} error={error}>
      {data && <BarChart data={data} title={props.title ?? meta?.title} unit={props.unit ?? meta?.unit} />}
    </ChartWithFallback>
  );
}
```

---

## Step 4: skill 定義 — `.claude/commands/fetch-blog-data.md`（新規）

既存スキルパターン（`sync-seed.md`）に準拠。引数確認 → スクリプト実行 → サマリー表示 → MDX 使用例表示 → `/push-r2` 案内。

---

## 変更ファイル一覧

| Step | ファイル | 操作 |
|---|---|---|
| 1.1 | `packages/types/src/blog-chart-data.ts` | 新規 |
| 1.1 | `packages/types/src/index.ts` | export 追加 |
| 1.2 | `packages/estat-api/src/scripts/fetch-blog-data.ts` | 新規 |
| 2 | `apps/web/src/app/api/blog-data/[...path]/route.ts` | 新規 |
| 3.1 | `apps/web/src/features/blog/hooks/useChartData.ts` | 新規 |
| 3.2 | `apps/web/.../blog/components/charts/ChartWithFallback.tsx` | 修正 |
| 3.3 | `apps/web/.../blog/types/chart-config.types.ts` | 修正 |
| 3.4 | `apps/web/.../blog/components/charts/BlogBarChart.tsx` | 修正 |
| 3.4 | `apps/web/.../blog/components/charts/BlogLineChart.tsx` | 修正 |
| 3.4 | `apps/web/.../blog/components/charts/BlogScatterPlot.tsx` | 修正 |
| 3.4 | `apps/web/.../blog/components/charts/BlogChoroplethMap.tsx` | 修正 |
| 4 | `.claude/commands/fetch-blog-data.md` | 新規 |

---

## 検証

```bash
# 1. スクリプト検証
npx tsx packages/estat-api/src/scripts/fetch-blog-data.ts \
  --slug test-article --statsDataId "0000020201" --chartType bar \
  --output test.json --prefectureOnly --latestYear

# 2. 型チェック
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/video && npx tsc --noEmit

# 3. API Route 検証（dev server 起動後）
curl http://localhost:3000/api/blog-data/test-article/data/test.json | jq '.data | length'

# 4. テスト MDX で <BarChart dataPath="/api/blog-data/test-article/data/test.json" /> 表示確認
```

## 完了後

- `docs/99_課題管理/ブログデータワークフロー_設計方針.md` を削除
- blog feature README.md に dataPath ワークフローのセクション追記
