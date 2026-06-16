# チャートコンポーネント標準 (shadcn UI + D3.js)

`apps/web/src/components/charts/` と `packages/visualization/` に置くチャート・カードコンポーネントの**単一ソース**。
新規実装・テーマ追加・監査を行うエージェント / 人間はこれに従う。

> **背景**: テーマページやダッシュボードで独自実装が散在し、色・スタイル・ツールチップが統一されていなかった（2026-06 整理）。
> `chart-component-builder` agent が管理するカタログが唯一の参照源。

---

## 1. コンポーネントカタログ（共通ライブラリ）

以下が**使ってよいコンポーネント**の全量。新規実装の前に必ずこのカタログを確認する。

### カード系（`apps/web/src/components/charts/`）

| コンポーネント | インポートパス | 用途 |
|---|---|---|
| `ChartCard` | `@/components/charts/ChartCard` | チャートを内包するカードラッパー（label / value / chart / footer スロット） |

### ミニチャート系（`apps/web/src/components/charts/`）

| コンポーネント | インポートパス | 用途 |
|---|---|---|
| `MiniLineChart` | `@/components/charts/MiniCharts` | カード内折れ線（当該団体実線 + 比較破線）。D3 インタラクティブ |
| `MiniBarChart` | `@/components/charts/MiniCharts` | カード内棒グラフ（正負値対応） |
| `MiniStackedBarChart` | `@/components/charts/MiniCharts` | カード内積み上げ棒グラフ |

### フルサイズチャート系（`packages/visualization/`）

| コンポーネント | インポートパス | 用途 |
|---|---|---|
| `LineChart` | `@stats47/visualization` | 時系列折れ線（複数系列対応、軸あり） |
| `BarChart` | `@stats47/visualization` | 棒グラフ（軸あり） |
| `HubSankey` | `@/components/charts/HubSankey` | 財政フロー Sankey 図 |

---

## 2. 実装禁止パターン（独自実装アンチパターン）

以下のパターンは**禁止**。カタログから代替を選ぶか、`chart-component-builder` に設計を依頼する。

```typescript
// ❌ ハードコードカラー（テーマ追従しない）
const BLUE = "#2563eb";
const GRAY = "#94a3b8";

// ❌ 独自カードラッパー（CardFrame 等）
function CardFrame({ label, value, children }) { ... }

// ❌ ページ内インライン SVG チャート（共有不可）
<svg>
  <rect fill="#2563eb" ... />
  ...
</svg>

// ❌ feature スコープのチャートコンポーネント
// features/xxx/components/MyChart.tsx  ← feature 内に閉じたチャートを作らない
```

---

## 3. 色・スタイル規約

### 色は CSS 変数のみ使用（ハードコード禁止）

| 用途 | CSS 変数 | 具体値（light mode） |
|---|---|---|
| 主系列・強調 | `hsl(var(--primary))` | blue-600 相当 |
| 比較系列・補助 | `hsl(var(--muted-foreground))` | slate-400 相当 |
| 背景 | `hsl(var(--card))` | white |
| ボーダー | `hsl(var(--border))` | slate-200 相当 |

積み上げ棒など**複数系列が必要な場合のみ**、呼び出し元から `colors` プロップで渡す（コンポーネント内にハードコードしない）。

### shadcn UI の利用

- カードは必ず `Card` / `CardHeader` / `CardContent`（`@stats47/components/atoms/ui/card`）を使う
- `cn()` は `@stats47/components` からインポート
- `shadow-lg` 禁止 → `shadow-sm`（デフォルト）/ `shadow-md`（hover）
- `rounded-xl` 禁止 → フラット（`--radius: 0`）

---

## 4. D3.js 利用規約

### ツールチップ

既存の `useD3Tooltip` を必ず使う（`@stats47/visualization` からインポート）。独自ツールチップ実装禁止。

```typescript
import { useD3Tooltip } from "@stats47/visualization";
const { showStackedTooltip, hideTooltip } = useD3Tooltip();
```

### SVG サイズ

- ミニチャート: `viewBox="0 0 260 84"` を基準に `width="100%"` でレスポンシブ
- フルサイズ: `packages/visualization` の `D3LineChartProps` / `D3BarChartProps` に従う

### アクセシビリティ

- SVG に必ず `role="img"` と `aria-label` を付与

---

## 5. 配置ルール

| 種別 | 配置場所 | 判定軸 |
|---|---|---|
| **汎用ミニチャート**（複数ページで使う小さなチャート） | `apps/web/src/components/charts/` | 2 箇所以上から使われる or 使われる見込みがある |
| **汎用フルサイズチャート**（D3 軸・凡例あり） | `packages/visualization/src/d3/components/` | パッケージ横断で使う |
| **ページ固有の複合コンポーネント**（再利用しない） | `apps/web/src/features/<feature>/components/` | 1 feature 内でしか使わないと確定している場合のみ |

**原則**: 迷ったら `apps/web/src/components/charts/` に置く。feature スコープを選ぶ積極的な理由がある場合のみ feature 内に置く。

---

## 6. 新規チャート追加フロー

```
1. カタログ確認 → 既存コンポーネントで対応可能か？
   ├─ YES → 既存を使う（実装しない）
   └─ NO  → 2 へ

2. chart-component-builder agent に設計を依頼
   - 必要なプロップ・色・インタラクションを伝える
   - agent がカタログに追加し、このファイルを更新する

3. 実装（agent または人間）
   - apps/web/src/components/charts/ に配置
   - CSS 変数カラーを使う
   - useD3Tooltip を使う（D3 インタラクティブの場合）
   - role="img" + aria-label を付与

4. /audit-chart-components スキルで規約違反がないか確認
```

---

## 7. 監査チェックリスト（`/audit-chart-components`）

| 項目 | NG パターン | 検出方法 |
|---|---|---|
| ハードコード色 | `#[0-9a-fA-F]{3,6}` が SVG fill/stroke に直書き | grep |
| 独自カードラッパー | `features/` 配下に card/frame 様の独自ラッパー | grep |
| feature スコープのチャート | `features/*/components/*.tsx` に SVG / D3 コード | grep |
| ツールチップ独自実装 | `useD3Tooltip` 未使用なのに tooltip 実装 | grep |
| shadcn Card 未使用 | カード形状コンポーネントなのに `Card` インポートなし | grep |

---

## 関連

- エージェント: `.claude/agents/chart-component-builder.md`
- スキル: `.claude/skills/ui/audit-chart-components/SKILL.md`
- shadcn UI 規約: `.claude/rules/ui-components.md`
- 共通ライブラリ: `apps/web/src/components/charts/` / `packages/visualization/src/d3/`
