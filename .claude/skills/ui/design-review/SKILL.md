React/TSX コンポーネントを melta-ui デザインシステムに照らしてレビューし、違反を検出・分類・修正提案する。

## 引数

```
$ARGUMENTS — レビュー対象のファイルパスまたはディレクトリ
             （例: apps/web/src/features/ranking/components/）
             （例: apps/web/src/app/page.tsx）
```

## 手順

### Step 1: 対象特定

- ファイルパスが渡された場合: そのファイルを読み取る
- ディレクトリが渡された場合: 配下の `.tsx` ファイルを Glob で列挙し、全ファイルを対象とする
- 引数なしの場合: 直近の git diff で変更された `.tsx` ファイルを対象とする

### Step 2: リファレンス読み込み

以下を読み込む:

1. `.claude/design-system/prohibited.md` — 禁止パターン一覧（SSOT）
2. `.claude/design-system/quick-reference.md` — 正しいパターンのリファレンス

### Step 3: 7 カテゴリ走査

対象ファイルの className / JSX を以下のカテゴリで走査する:

1. **カラー**: `text-black`, `text-gray-400`（body用途）, `border-gray-100`, `bg-gray-300+` の検出
2. **スペーシング・レイアウト**: `shadow-lg`/`shadow-2xl`, `rounded-none`（カード）, `p-0`（カード）, カラーバー（`border-t-4`, `border-l-4`）
3. **タイポグラフィ**: `tracking-tight`, `text-xs`（body用途）, `font-light`
4. **モーション**: `duration-500+`, `prefers-reduced-motion` 未対応
5. **ボーダー**: `border-gray-100`, `border-slate-400+`
6. **フォーム**: `<label>` 欠損, `<select>` の `appearance-none` 欠損
7. **アクセシビリティ**: `aria-label` 欠損（アイコンボタン）, `<th scope>` 欠損, `outline: none` without ring

**stats47 固有チェック**:
- 素の HTML 要素（`<table>`, `<select>`, `<button>`）の使用 → `@stats47/components` を推奨
- ビューポート `md:` がダッシュボードカードグリッドに使われていないか → コンテナクエリ `@md:` を推奨
- h1 に `text-3xl` 以上が使われていないか → `text-2xl font-bold` を推奨

### Step 4: 重大度判定

各違反に重大度を付与:

| 重大度 | 基準 | 例 |
|--------|------|---|
| Critical | アクセシビリティ違反・WCAG 不適合 | `text-gray-400` for body, `aria-label` 欠損 |
| High | 禁止パターンに明確に該当 | `shadow-lg`, `tracking-tight`, カラーバー |
| Medium | 推奨パターンからの逸脱 | `bg-gray-*` → `bg-slate-*` 統一 |
| Low | 改善推奨だが機能に影響なし | セクション間隔の不統一 |

**偽陽性の排除**:
- `packages/components/src/` 内の shadcn/ui デフォルト（`tracking-tight` 等）は除外する
- shadcn CSS 変数（`text-muted-foreground` 等）はセマンティックカラーとして許容する
- hover 時の `shadow-md` は許容する

### Step 5: レポート出力

```markdown
## デザインレビュー: {対象}

### サマリー
- Critical: N件
- High: N件
- Medium: N件
- Low: N件

### 違反一覧

#### Critical

| # | ファイル:行 | カテゴリ | 違反内容 | 修正案 |
|---|------------|---------|---------|--------|
| 1 | path:42 | カラー | `text-gray-400` を body テキストに使用 | `text-muted-foreground` |

#### High
...

#### Medium
...

#### Low
...

### 良い点
- ...
```

## 注意

- 出力は保存しない。会話の中で直接表示する
- 修正案は具体的な Tailwind クラスまたは shadcn コンポーネントで提示する
- 大量の違反がある場合は Critical / High を優先し、Low は件数のみ報告する
