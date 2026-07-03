---
type: tech-design
date: 2026-06-29
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
- ページ見出し: `PageHeader`。**全 hero / header の唯一の基盤**。独自 hero コンポーネントを新設しない。差分は後方互換の任意 slot で表現する（2026-06-23 Phase 2 で統合）:
  - `actions`（h1 右の CTA / セレクタ）— 例: `ThemeAreaHeader` が `PrefectureSelect` を注入
  - `meta`（title 直下の出典/年度/更新の細い行）/ `controls`（header ブロック下の操作行）/ `aside`（右カラム。指定時のみ lg で 2 カラム grid 化）— 例: `RankingHeroCard` が `aside`（暗色 KPI 面 `RankingHeroStat`）+ `controls`（正規化ピル）を合成
  - 全 slot 未指定時は標準ミニマル見出しと DOM 不変。`PageHeader` 本体には暗色背景/グラデを足さない（白基調）。暗色 KPI 面は `aside` に渡す presentational 子の意図的 `bg-slate-900` variant で表現する。
- 記事・規約など読むページ: `PageShell variant="reading"`
- 補助列の左右セマンティクス（用途で side を固定する。見た目の左右非対称は意図的）:
  - **`leftRail` = ナビゲーション**（テーマナビ等、ページ内を移動する目的）。例: `/themes/*`
  - **`rightRail` = 関連 / 広告 / widget**（TOC・関連記事・関連ランキング・AdSense）。例: areas / tag / ranking 詳細 / blog 詳細
  - どちらも本文 + 片側 1 列。同一ページで両 rail は使わない（3 列禁止）
- パンくず: **単一 `PageShell` の先頭子**として `<Breadcrumb className="mb-4">` を置く（tag / areas / blog 共通）。breadcrumb 専用に別 `PageShell` を二重に積まない。
- ランキング詳細 (`/ranking/*`) も他ページ同様 `PageShell` の `rightRail`（xl/360px・sticky）を使う。独自グリッド・独自幅レールは禁止（2026-06-23 統一）。
- ブログ詳細のように右 rail を lg+ で出すページ: `PageShell rightRailBreakpoint="lg"`。TOC は右 rail の先頭、lg 未満は記事冒頭に置く。
- ページ内セクション: `section` + 短い `h2` + 必要な説明文

### 禁止

- `page.tsx` 内で `container mx-auto` / `max-w-[1700px]` / 独自 2-3 カラム grid を直書きする。
- `leftRail` と `rightRail` を同時利用して 3 列レイアウトを作る。基本は本文 + 片側 rail の 2 列。
- ページごとに右レール幅を変える。表示 breakpoint が違う場合も `PageShell` の props で表現する。
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
- 男女、増減、危険/改善、歳入/歳出、流入/流出など意味が固定される色は、`ChartPalette.ts` の用途別 semantic color に寄せる。
- raw hex を使う場合は、チャート・地図・ブランドロゴなど、semantic token では意味が曖昧になる箇所に限定する。

### 禁止

- 通常 UI で `text-slate-*` / `bg-slate-*` / `bg-white` / raw hex を増やす。
- light mode だけを想定した色を書く。
- 色だけで状態や意味を表現する。

## Surface / Card

カードは「情報をまとめるための面」であり、装飾ではない。

> **配置 tier**: どの層にコンポーネントを置くか（① プリミティブ=`@stats47/components` / ② 共有 composite=`@/components/{surface,charts,stat-charts,layout}` / ③ feature 固有）の判断は `.claude/rules/ui-components.md`「コンポーネント配置の 3 tier」が SSOT。
> 2026-06-23 の UI 統一ロードマップ Phase 0-3 で主要な PageShell / PageHeader / rail / card ガバナンスは完了済み。残タスクは `docs/02_実装計画/04_機能バックログ.md` の `UI-CONSOLIDATION-RESIDUAL` で追う。

### 採用

- 基本カード: `SurfaceCard`
- ページ内の大きな情報枠: `SurfaceSection`
- クリック可能な一覧カード: `SurfaceLinkCard`
- `TrackedAffiliateLink` など Next `Link` 以外のクリック可能カード: `getSurfaceCardClassName({ interactive: true })`
- rail / sidebar 内の見出し付きカード: `RailCard`
- rail / sidebar 内の縦リンクリスト: `RailLinkList` / `RailLinkItem`
- チャート・地図など可視化の外枠: `ChartPanel`
- チャートの loading / empty / error 表示: `ChartLoading` / `ChartEmptyState` / `ChartErrorState` / `ChartLoadingCard` (`apps/web/src/components/charts/ChartState.tsx`)
- チャートの出典・注記・関連リンク: `ChartFooter` (`apps/web/src/components/charts/ChartFooter.tsx`)
- Web アプリ側のチャート色: `CHART_COLORS` / `getChartColor` / `getChartColors` / `FINANCE_CHART_COLORS` / `FLOW_CHART_COLORS` (`apps/web/src/components/charts/ChartPalette.ts`)
- チャート凡例: `ChartLegend` (`apps/web/src/components/charts/ChartLegend.tsx`)
- `@stats47/visualization` 内の D3 HTML 凡例: `D3ChartLegend` (`packages/visualization/src/d3/components/shared/D3ChartLegend.tsx`)
- Leaflet タイル: `useThemedLeafletTile(theme)` (`apps/web/src/features/map-visualization/utils/use-themed-leaflet-tile.ts`)
- 地図の semantic color: `LEAFLET_MAP_COLORS` / `getLeafletBorderColor` (`apps/web/src/features/map-visualization/utils/map-palette.ts`)
- ranking map adapter: `rankingItemToMapConfig` / `filterMapDataPoints` (`apps/web/src/features/map-visualization/utils/ranking-map-adapters.ts`)
- KPI ミニカード・指標表などの薄い用途別ラッパー: `ChartCard` / `KeyMetricsTableCard`。ただし外枠は `SurfaceCard` ベースにする。
- 旧 `DashboardCard` / `LegacyDashboardCard` は削除済み。復活させず、通常チャート・地図は `ChartPanel`、KPI ミニカードは `ChartCard` を使う。
- shadcn `Card` は低レベル primitive として扱い、アプリ feature からの直接利用は既存互換・特殊事情に限定する。
- hover は `hover:shadow-md` まで。

### 禁止

- `rounded-none border bg-card p-4 shadow-sm ...` を各ページで何度も直書きする。
- sidebar / rail ごとに `SurfaceCard + border-b header + nav` を手組みする。
- 地図専用・ブログ専用・ランキング専用など、外枠だけが違うカードコンポーネントを増やす。
- `MapPanel` のような `ChartPanel` と責務が重なる可視化パネルを新設する。
- `データがありません` / `読み込み中` / `チャートを表示できません` の空・読込・エラー状態を feature ごとに直書きする。
- `--chart-*` token 配列や凡例のマーカー HTML を feature / chart component ごとに直書きする。Web アプリでは `ChartPalette` / `ChartLegend`、visualization package では `D3ChartLegend` を使う。
- `TILE_OPTIONS_LIGHT[0]` など Leaflet タイルを feature component で直接固定する。
- Leaflet 境界色、選択色、領域区分色を feature component ごとに raw hex で定義する。`map-palette.ts` に semantic name で追加する。
- `DashboardCard` / `LegacyDashboardCard` を復活させる。
- `LegacyChartFooter` を復活させる。
- `shadow-lg` / `shadow-2xl` を通常カードに使う。
- カード上端/左端の色付きバーで装飾する。
- `CardContent` の `pt-0` を安易に使う。

### 広告・PR の例外

広告はブランド色や計測要件があるため、通常カードより例外を許す。ただし、例外は「広告であることの識別」「ブランド指定」「アフィリエイト計測」のために限定する。

- PR 枠の外側は、ブランド背景やカテゴリ別背景を使ってよい。
- 広告内のクリック可能な商品・テキストリンクは、可能な限り `getSurfaceCardClassName({ interactive: true })` で通常 surface と同じ枠線・shadow・hover に揃える。
- `bg-white` は、ブランド CTA やロゴ可読性など明確な理由がある場合だけ残す。
- 計測付きリンクを `SurfaceLinkCard` に無理に置き換えない。`TrackedAffiliateLink` に surface class helper を渡す。

### OGP の例外

OGP は SNS / search preview 向けの固定画像であり、通常 UI の light/dark theme token には追従しない。画像としての再現性、視認性、ブランド識別を優先する。

- OGP の固定色、地図 palette、影、半透明 surface は `apps/web/src/features/ogp/brand.ts` に集約する。
- OGP component 内で `#fff` / `#2563EB` / `rgba(...)` などを直接書かない。
- OGP の色定義を通常 UI に持ち込まない。通常 UI は `ChartPalette` / `map-palette.ts` / theme token を使う。
- `design-system:check` は `features/ogp/brand.ts` 以外の OGP raw color を検出する。

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
- 詳細ページは本文 + 右 rail の 2 列に揃える。TOC、広告、関連記事は `rightRail` に寄せ、lg 未満では TOC を記事冒頭に置く。
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

- `npm run design-system:check --workspace apps/web` が通るか。
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
