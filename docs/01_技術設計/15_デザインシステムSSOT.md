---
type: tech-design
date: 2026-06-21
status: active
tags: [design-system, ui, ssot, agent]
---

# デザインシステム SSOT

stats47 の UI 実装判断を一本化する正典。Claude Code / Codex / 人間の実装者は、UI を作る・直す・レビューするとき、この文書を最初の判断基準にする。

この文書は「何を採用するか」を決める。具体的な実装詳細は、下記のコード・設計文書を正として参照する。

## SSOT の階層

| 領域 | 正典 | 役割 |
|---|---|---|
| UI 判断ルール | `docs/01_技術設計/15_デザインシステムSSOT.md` | 本文書。エージェントと人間が共有する判断基準 |
| レイアウト詳細 | `docs/01_技術設計/13_統一レイアウト設計.md` | 横幅、レール、PageShell、PageHeader、ナビ |
| テーマトークン | `apps/web/src/app/globals.css` | CSS variables、light/dark、フォント、radius |
| Tailwind 設定 | `apps/web/tailwind.config.ts` | semantic color、container、container query |
| UI primitive | `packages/components/src` | shadcn/Radix ベースの共通部品 |
| app 共通レイアウト | `apps/web/src/components/layout` | `PageShell` / `PageHeader` |
| chart/page component | `docs/01_技術設計/07_情報設計.md` + page-components 定義 | ページ責務と動的ダッシュボード配置 |

`.claude/design-system/` は Claude 専用の正典ではない。古い入口・レビュー補助として残し、内容が食い違う場合は常に `docs/01_技術設計/15_デザインシステムSSOT.md` を優先する。

## 基本方針

stats47 の UI は、統計データを長時間読むための道具である。派手な装飾より、読みやすさ、比較しやすさ、再利用しやすさを優先する。

- 白基調、余白主導、低ノイズ。
- ページ上部はミニマルにし、暗色 hero や KPI タイルを増やさない。
- 同じ種類の UI は同じ部品・同じ余白・同じ色トークンで作る。
- データ可視化では、色だけで意味を伝えない。ラベル、凡例、単位を併用する。
- 既存の共通部品で表現できる場合、新しい見た目を発明しない。

## レイアウト

ページ幅、左右レール、ページ余白は `PageShell` が唯一の入口。

### 採用

- ページ外側の幅制御: `PageShell`
- ページ見出し: `PageHeader`
- 記事・規約など読むページ: `PageShell variant="reading"`
- TOC / 関連記事 / 広告などの補助列: `leftRail` / `rightRail`
- ページ内セクション: `section` + 短い `h2` + 必要な説明文

### 禁止

- `page.tsx` 内で `container mx-auto` / `max-w-[1700px]` / 独自 2-3 カラム grid を直書きする。
- ページごとに右レール幅を変える。
- PC 常設左サイドバーを復活させる。
- ページ上部に暗色グラデ hero や KPI タイルを安易に追加する。

例外が必要な場合は、該当コードの近くではなく、この文書か `13_統一レイアウト設計.md` に理由を追記する。

## タイポグラフィ

### 採用

- ページ h1: `PageHeader` 内の `text-2xl font-bold`
- 本文: system font stack。Web フォント追加はしない。
- 補助文: `text-muted-foreground`
- 日本語本文で字間を詰めない。

### 禁止

- 本文 UI で `tracking-tight` を使う。
- h1 をページごとに `text-3xl` 以上へ拡大する。
- 本文説明を `text-xs` に落としすぎる。
- placeholder だけで入力のラベルを代替する。

## 色

アプリ UI は semantic token を優先する。

### 優先トークン

- `text-foreground`
- `text-muted-foreground`
- `bg-background`
- `bg-card`
- `bg-muted`
- `border-border`
- `text-primary`
- `bg-primary`
- `text-destructive`

### チャート色

- 汎用チャートは `--chart-1` から `--chart-5`、または共有 chart constants を使う。
- 男女、増減、危険/改善など意味が固定される色は、共有定義に寄せる。
- raw hex を使う場合は、チャート・地図・ブランドロゴなど、semantic token では意味が曖昧になる箇所に限定する。

### 禁止

- 通常 UI で `text-slate-*` / `bg-slate-*` / `bg-white` / raw hex を増やす。
- light mode だけを想定した色を書く。
- 色だけで状態や意味を表現する。

## Surface / Card

カードは「情報をまとめるための面」であり、装飾ではない。

### 採用

- 基本カード: `SurfaceCard`
- ページ内の大きな情報枠: `SurfaceSection`
- クリック可能な一覧カード: `SurfaceLinkCard`
- チャート・地図など可視化の外枠: `ChartPanel`
- KPI ミニカード・指標表などの薄い用途別ラッパー: `ChartCard` / `KeyMetricsTableCard`。ただし外枠は `SurfaceCard` ベースにする。
- 統計ダッシュボード既存資産: `DashboardCard` は deprecated。既存 stat-charts 内部では `LegacyDashboardCard` 名で隔離し、新規追加では使用しない。
- shadcn `Card` は低レベル primitive として扱い、アプリ feature からの直接利用は既存互換・特殊事情に限定する。
- hover は `hover:shadow-md` まで。

### 禁止

- `rounded-none border bg-card p-4 shadow-sm ...` を各ページで何度も直書きする。
- 地図専用・ブログ専用・ランキング専用など、外枠だけが違うカードコンポーネントを増やす。
- `MapPanel` のような `ChartPanel` と責務が重なる可視化パネルを新設する。
- `DashboardCard` を新規利用する。
- `shadow-lg` / `shadow-2xl` を通常カードに使う。
- カード上端/左端の色付きバーで装飾する。
- `CardContent` の `pt-0` を安易に使う。

## Radius / Shadow

stats47 は 2026-06 以降、フラット方針。

- `--radius: 0` を正とする。
- カードやパネルに個別の大きな角丸を足さない。
- 円形の意味があるものだけ `rounded-full` を許容する。
- shadow は `none` / `shadow-sm` / `shadow-md` / overlay 用 `shadow-xl` に限定する。

## ページ種別ごとのルール

### Blog

- 一覧、タグ、詳細の外側レイアウトは `PageShell` を使う。
- 記事本文の可読幅は `variant="reading"` または記事用 content wrapper で制御する。
- TOC、広告、関連記事は `leftRail` / `rightRail` に寄せる。
- 記事本文 typography は `.blog-article` または承認済み renderer に集約する。

### Ranking

- ランキング詳細の上部は既存の `RankingHeroCard` 系を優先し、新しい hero を増やさない。
- 表、地図、関連ランキング、FAQ は既存 feature component を再利用する。
- area type / year / basis の切り替え UI は既存パターンに揃える。

### Theme Dashboard

- テーマページの外側は `PageShell` + `ThemePageLayout` を使う。
- ダッシュボードカードグリッドは container query を優先する。
- チャート定義は可能な限り page-components 側へ寄せ、ページコードに定義を増やさない。

### Area / City

- 都道府県・市区町村ページも `PageShell` を使う。
- パンくず、プロフィール、関連ランキングの見た目は feature 共通 component に寄せる。

## エージェント向け読み込みルール

UI 変更をするエージェントは、作業前にこの文書の該当節だけを読む。`CLAUDE.md` や agent prompt にこの文書の全文を複製しない。

### 最小参照

- レイアウト・ページ幅に触る: 本文書「レイアウト」 + `13_統一レイアウト設計.md`
- 色・余白・カードに触る: 本文書「色」「Surface / Card」「Radius / Shadow」
- ブログ・ランキング・テーマに触る: 本文書「ページ種別ごとのルール」
- チャート追加: 本文書「Theme Dashboard」 + 既存 chart component catalog

### 完了前チェック

- `PageShell` / `PageHeader` を使うべき場所で使ったか。
- `container mx-auto` / `max-w-[...]` を新規追加していないか。
- `text-slate-*` / `bg-white` / raw hex を通常 UI に追加していないか。
- 同じカード class を複数箇所に直書きしていないか。
- shadcn/Radix primitive を再実装していないか。
- dark mode で読める semantic token になっているか。

## 移行方針

この SSOT は新規 UI と変更対象に対して適用する。既存の全違反を一括で直す必要はない。

優先順位:

1. 触ったページで `PageShell` / `PageHeader` から外れている箇所を戻す。
2. 繰り返し surface class を shared component に吸収する。
3. 通常 UI の direct color を semantic token に置換する。
4. チャート色の raw hex を共有定義へ寄せる。

大規模置換は、見た目の回帰確認ができる単位で分ける。
