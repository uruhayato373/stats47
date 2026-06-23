# UI コンポーネント規約

> デザインシステム全体の正典は `docs/01_技術設計/15_デザインシステムSSOT.md`。
> このファイルは Claude Code 向けの実装時メモであり、食い違う場合は docs 側を優先する。

## レイアウト・フォント・角丸（2026-06〜 / 正典: `docs/01_技術設計/13_統一レイアウト設計.md`）

- **横幅は `PageShell`（`@/components/layout`）経由で統一**。ページ内で `container mx-auto` や `max-w-[…]` を直書きしない（1700px / 右レール 360px / 左 TOC 280px、`variant="reading"` で本文 760px）。
- **PC 常設左サイドバーは廃止**。ナビはヘッダー（カテゴリは**メガメニュー**）に集約し、モバイルは `MobileNavDrawer`（Sheet）。
- **角丸はサイト全体でフラット（`--radius: 0`）**。`rounded-xl`/`rounded-2xl` の手動付与は禁止（`rounded-none`）。**円形のみ `rounded-full`**（アイコン背景・ピル・アバター）。
- **本文フォントは system スタック**（游ゴシック/Hiragino、Web フォント非依存）。Inter/Noto Sans JP は読み込まない（コードのみ Geist Mono）。

## Sticky aside の max-h 必須ルール（★削除禁止・2026-06-06）

CSS Grid (`lg:grid` + `items-start`) 内の `sticky` aside には **必ず `max-h-[calc(100vh-5.5rem)]` と `overflow-hidden` または `overflow-y-auto` を付ける**。

- Grid の行高 = 列のうち最も高い要素で決まる。aside に `max-h` がないと aside の自然高が行高を決定し、フッターが画面外に押し出される（記事本文の末尾でスクロール終了しているように見えてもフッターに届かない）。
- **削除した事例**: 2026-06-06、subagent が blog/category/ranking ページの aside から `max-h` を除去してフッターが非表示になった（commit `5d9afb24`、revert `a2c76216`・`b18be52a`）。

```tsx
// ✅ 必須パターン (blog/[slug]/page.tsx の右 aside)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20
                  lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden lg:pr-1">

// ✅ RightRailWidgets の scrollClass (stickyScroll=true 時)
"xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1"

// ❌ max-h なしは禁止 (フッターが見えなくなる)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20 lg:pr-1">
```

適用箇所:
- `apps/web/src/app/blog/[slug]/page.tsx` — 左・右 aside
- `apps/web/src/app/category/[categoryKey]/page.tsx` — 右 aside
- `apps/web/src/features/redesign/components/RightRailWidgets.tsx` — `scrollClass`
- 3カラムレイアウトを持つすべての新規ページ

## コンポーネント配置の 3 tier（★新規コンポーネント追加前に必読・配置の SSOT）

新規 UI を作るときは、まず**どの tier に置くか**を決める。下位 tier に既にあるものを feature 内に再実装しない
（再実装が共通化を阻む最大要因。実測で feature 層の重複が散在 → 是正は `docs/02_実装計画/13_UI統一ロードマップ.md` Phase 0/2/3）。

| tier | 置き場所 | import 元 | 中身 | 追加方法 |
|---|---|---|---|---|
| **① プリミティブ** | `packages/components/src/atoms/ui` | `@stats47/components` | shadcn/ui 由来の素部品（Button/Card/Select/Table/Tabs…30 個） | `cd packages/components && npx shadcn add`（`packages/components/README.md`）。app-local に置かない |
| **② 共有 composite** | `apps/web/src/components/{surface,charts,stat-charts,layout,molecules}` | `@/components/...` | 複数 feature が使う合成部品（`SurfaceCard` / `ChartCard` / `PageShell` / `MiniCharts` / KPI カード等）。**これは正式な共有層**（実質 180+ import のハブ） | ① を組み合わせて作る。チャートは `chart-component-builder` agent |
| **③ feature 固有** | `apps/web/src/features/<feature>/components` | feature 内 `index.ts` 経由 | その feature だけで使う UI。複数 feature で必要になったら ② へ昇格 | feature 内。**他 feature から直接 import しない**（app 層経由で合成） |

判断フロー: 「① にあるか？ → ② にあるか？ → 無ければ作る（汎用なら ②、その feature 専用なら ③）」。

- **`@stats47/components` の shadcn ベースコンポーネント（① プリミティブ）を最優先で使う。**
  Table / Card / Accordion / Select / Button 等が揃っている。素の HTML 要素（`<table>`, `<select>`, `<button>` 等）で実装せず、まず `packages/components/src/` に該当コンポーネントがないか確認すること。
- **Card は基底（① `Card` / ② `SurfaceCard`）から作る。** feature 内に独自カード枠を新規定義しない（Card 乱立の解消は Phase 0-1）。

## チャートコンポーネント（★新規追加前に必読）

チャート・グラフを追加するときは先に **`.claude/rules/chart-component-standards.md`** のカタログを確認する。
既存の `MiniLineChart` / `MiniBarChart` / `ChartCard` 等が使えるケースでは再実装しない。
新規チャートが必要な場合は `chart-component-builder` agent に設計を依頼する。
規約違反の検出は `/audit-chart-components` スキルで実行する。

- **ページ見出し（h1）は `text-2xl font-bold` に統一する。** `text-3xl` 以上は使わない。
  - **例外: hero バナー内の h1**（色付き `HeroShell` / hero セクション内のキャッチコピー）は `text-2xl sm:text-3xl`（home のみ `text-3xl sm:text-4xl lg:text-5xl`）のレスポンシブ大見出しを許容する。マーケ目的の意図的拡大であり、コンテンツ本文の h1（ranking/category 詳細・記事タイトル）とは役割が異なる。該当: `app/page.tsx`・`category/[categoryKey]`・`themes`・`survey/[surveyKey]`・`tag/[tagKey]`。本文コンテンツの h1 では `text-2xl` を厳守する。

## melta-ui デザインシステム準拠

詳細は `.claude/design-system/prohibited.md` を参照。以下は特に重要な禁止項目:

- `text-black` 禁止 → `text-slate-900` or `text-foreground`
- `shadow-lg` / `shadow-2xl` 禁止 → `shadow-sm`（デフォルト）/ `shadow-md`（hover）
- `tracking-tight` 禁止 → 日本語の可読性低下のため削除
- カラーバー（`border-t-4`, `border-l-4` + 色付き）禁止 → 全周 `border` で統一
- `text-gray-400` を本文に使用禁止 → `text-muted-foreground` or `text-slate-500`
- カード hover: `hover:shadow-md` まで（`hover:shadow-lg` 禁止）

デザインレビュー: `/design-review` スキルで違反チェック可能

## レスポンシブブレイクポイントの使い分け

| 対象 | 使うべきブレイクポイント | 理由 |
|---|---|---|
| ページレイアウト（2カラム/1カラム、右レール表示） | `xl:` (ビューポート 1280px) | `PageShell` の右レール（360px）は `xl:` で出現 |
| テキスト・ボタンのサイズ調整 | `sm:` / `md:` (ビューポート) | デバイスサイズで決まる |
| ダッシュボードカードグリッド | `@sm:` / `@md:` / `@lg:` (コンテナクエリ) | 親コンテナ幅が可変（右レール有無で本文カラム幅が変動）のため |

コンテナクエリのブレイクポイントは `tailwind.config.ts` でカスタム定義（`@sm: 480px`, `@md: 768px`, `@lg: 1024px`）。プラグインのデフォルト値とは異なるので注意。ビューポートブレイクポイントとコンテナクエリの混在は意図的な設計。カードグリッドをビューポートの `md:` に変えると右レールあり画面で幅不足になるため、必ずコンテナクエリを使うこと。

## ダッシュボードコンポーネント

- **KPI・チャート等は `page_components` テーブルで管理する。** コード内にチャート定義をハードコードしない。新規追加は DB への INSERT のみ。
- 詳細は `.claude/design-system/page-components.md` を参照。
