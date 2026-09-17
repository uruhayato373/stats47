---
name: design-review
description: melta-ui デザインシステム準拠レビューを実行する。Use when user says "デザインレビュー", "UI違反チェック", "デザインシステム確認". 7カテゴリ走査・重大度判定・修正提案.
disable-model-invocation: true
primary_agent: ui-reviewer
---

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

### Step 3: 機械ゲート実行 (rail-* contract)

対象にレール系 UI (`RailCard` / `RailNavRow` / `RailCategoryList` / `RailLinksCard` / page.tsx の左右レール) が
含まれる場合は、目視の前に決定的ゲートを走らせる。

```bash
npm run design-system:check -w apps/web
```

`rail-no-raw-aside-in-page` / `rail-card-no-muted-root` / `rail-links-no-grid-layout` /
`rail-category-must-use-shared-list` / `rail-no-page-name-variant` / `rail-no-colored-inset-bar` /
`rail-nav-needs-accessible-name` / `rail-row-needs-44px-tap-target` の 8 rule を含む
(正典: `docs/01_技術設計/04_デザインシステム.md`「レール UI 契約」)。

### Step 4: 7 カテゴリ走査

対象ファイルの className / JSX を以下のカテゴリで走査する:

1. **カラー**: `text-black`, `text-gray-400`（body用途）, `border-gray-100`, `bg-gray-300+` の検出
2. **スペーシング・レイアウト**: `shadow-lg`/`shadow-2xl`, `p-0`（カード）, カラーバー（`border-t-4`, `border-l-4`）
3. **タイポグラフィ**: `tracking-tight`, `text-xs`（body用途）, `font-light`
4. **モーション**: `duration-500+`, `prefers-reduced-motion` 未対応
5. **ボーダー**: `border-gray-100`, `border-slate-400+`
6. **フォーム**: `<label>` 欠損, `<select>` の `appearance-none` 欠損
7. **アクセシビリティ**: `aria-label` 欠損（アイコンボタン）, `<th scope>` 欠損, `outline: none` without ring

**実測が要るもの (静的検査では出ない)**: 横スクロール・タップ領域・キーボード順序・
フォーカスリング・dark mode の実配色は、コードを読んでも分からない。ページを実際に開いて測る:

```bash
node .claude/scripts/ui/measure-page-a11y.mjs http://localhost:3000/areas --widths 390,768,1024,1440
```

複数の幅 × light/dark で、overflow・24px/44px 未満のタップ領域・キーボード到達・
console エラーを一度に出す。**dark は `colorScheme` ではなく localStorage の `theme` で切り替える**
(このサイトは next-themes を `enableSystem={false}` で使っており OS 設定を無視するため、
`colorScheme: 'dark'` で測ると light と同じ色が返って「dark が壊れている」と誤報する)。

**stats47 固有チェック**:
- 素の HTML 要素（`<table>`, `<select>`, `<button>`）の使用 → `@stats47/components` を推奨
- ビューポート `md:` がダッシュボードカードグリッドに使われていないか → コンテナクエリ `@md:` を推奨
- h1 に `text-3xl` 以上が使われていないか → `text-2xl font-bold` を推奨

**レール契約 (rail-* 8 rule、詳細は `rail-contract-audit.mjs`)**:
- `rail-no-raw-aside-in-page`: page.tsx が独自の `<aside>` を描いていないか
- `rail-card-no-muted-root`: `RailCard`/`SectionCard` の外枠に `bg-muted` が付いていないか
- `rail-links-no-grid-layout`: `RailLinksCard layout="grid"`（廃止済み）が復活していないか
- `rail-category-must-use-shared-list`: カテゴリ導線が `RailCategoryList` 以外で独自実装されていないか
- `rail-no-page-name-variant`: `variant="home"` 等ページ名依存の variant が無いか
- `rail-no-colored-inset-bar`: active 行をカラーバー（inset shadow）で示していないか
- `rail-nav-needs-accessible-name`: レール内 `<nav>` に `aria-label`/`aria-labelledby` があるか
- `rail-row-needs-44px-tap-target`: レール内リンク/ボタンがモバイル 44px（`min-h-11`）を満たすか

### Step 5: 重大度判定

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

### Step 6: レポート出力

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
