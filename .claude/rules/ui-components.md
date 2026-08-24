# UI コンポーネント規約

> デザインシステム全体の正典は `docs/01_技術設計/04_デザインシステム.md`。
> このファイルは Claude Code 向けの実装時メモであり、食い違う場合は docs 側を優先する。

## レイアウト・フォント・角丸（2026-06〜 / 正典: `docs/01_技術設計/04_デザインシステム.md`）

- **横幅は `PageShell`（`@/components/layout`）経由で統一**。ページ内で `container mx-auto` や `max-w-[…]` を直書きしない。正確な幅と rail 寸法は `PageShell.tsx` を正典とする。**寸法は doboku-note に合わせている（2026-08-03）**: コンテナ 1280px / lg+ 左右 40px（`lg:px-10`）/ gap 40px（`gap-10`）/ 右レール **316px**。300×250 の `SidebarPromoBanner` は Card で囲まず、レール内に等倍で表示する。**記事系ページ（blog 詳細 / ranking 詳細 / survey / terms / privacy）は `ArticleShell`**（reading zone + flex 密着）を使う。
- **サイト全体ナビの PC 常設左サイドバーは廃止**。グローバルナビはヘッダー（カテゴリは**メガメニュー**）に集約し、モバイルは `MobileNavDrawer`（Sheet）。
  - **例外: ページ内ナビの左レール（2026-08-04）**。「そのページの表示内容を切り替えるナビ」は `PageShell` の `leftRail` に置いてよい。Theme はテーマ切替 + 地域 + ページ内目次 + 全指標 + 出典調査、home / `/ranking` / `/category/*` はカテゴリ探索を置く。全テーマやグローバルナビを常時展開して複製しない。
  - 左レールは `PageShell` 実装上**右レールと併用できない**（`showLeft = hasLeft && !hasRight`）。テーマページは元々右レールなしなので成立する。
  - **左レールは `lg`(1024px) から出す**。列幅・gap は `PageShell` だけが持ち、page.tsx に `grid-cols-[264px_…]` 等を複製しない。機械ゲート = `page-shell-rail-contract.test.tsx` + `check-design-system.mjs`。
  - **lg 未満で操作ナビを隠す場合は `leftRailNarrowBehavior="hide"` とし、テーマ・地域・ページ内目次・全指標・出典調査の同等 UI を本文上部に出す**。関連リンク型の左レールは既定 `stack` で本文後へ積んでよい。
  - 左レールが `ThemePrefectureProvider` のような context を使う場合、**Provider の内側に leftRail を置く**（`ThemePageLayout` が Provider → `PageShell` の入れ子を持ち、呼び出し側の page.tsx は `PageShell` を重ねない）。
- **角丸は記事系ページを含むサイト全体でフラット（`--radius: 0`）**。カードやパネルへの `rounded-xl`/`rounded-2xl` の手動付与は禁止し、外枠は `rounded-none` とする。**円形のみ `rounded-full`**（アイコン背景・ピル・アバター）。`ArticleShell` の `.reading-zone` は薄グレー地を維持するが、角丸と影は通常カード（`rounded-none`・`shadow-sm`）に揃える。
- **本文フォントは system スタック**（游ゴシック/Hiragino、Web フォント非依存）。Inter/Noto Sans JP は読み込まない（コードのみ Geist Mono）。

## Sticky aside の max-h 必須ルール（★削除禁止・2026-06-06）

CSS Grid (`lg:grid` + `items-start`) 内の `sticky` aside には **必ず `max-h-[calc(100vh-5.5rem)]` と `overflow-hidden` または `overflow-y-auto` を付ける**。

- **右レールは独立スクロールを作らない**。`ArticleShell` と `RightRailWidgets` は flex の自然フローで配置し、ページ本体のスクロールだけで全 widget に到達できるようにする。`max-h` と `overflow-y-auto`、それらを有効化する option は追加しない。
- Grid の行高 = 列のうち最も高い要素で決まる。aside に `max-h` がないと aside の自然高が行高を決定し、フッターが画面外に押し出される（記事本文の末尾でスクロール終了しているように見えてもフッターに届かない）。
- **削除した事例**: 2026-06-06、subagent が blog/category/ranking ページの aside から `max-h` を除去してフッターが非表示になった（commit `5d9afb24`、revert `a2c76216`・`b18be52a`）。

```tsx
// ✅ 必須パターン (blog/[slug]/page.tsx の右 aside)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20
                  lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden lg:pr-1">

// ✅ flex の右レールは自然フロー（内部スクロールなし）
<aside className="hidden w-[316px] shrink-0 lg:flex lg:flex-col lg:gap-3">

// ❌ sticky grid aside で max-h なしは禁止 (フッターが見えなくなる)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20 lg:pr-1">
```

適用箇所:

- `apps/web/src/app/blog/[slug]/page.tsx` — 左・右 aside
- `apps/web/src/app/category/[categoryKey]/page.tsx` — 右 aside
- 3カラムレイアウトを持つすべての新規ページ

独立スクロール禁止の適用箇所:

- `apps/web/src/components/layout/ArticleShell.tsx`
- `apps/web/src/components/rail/RightRailWidgets.tsx`
- 右レールに渡す widget

## コンポーネント配置の 3 tier（★新規コンポーネント追加前に必読・配置の SSOT）

新規 UI を作るときは、まず**どの tier に置くか**を決める。下位 tier に既にあるものを feature 内に再実装しない
（再実装が共通化を阻む最大要因。実測で feature 層の重複が散在 → 恒久ルールは `docs/01_技術設計/04_デザインシステム.md` に集約）。

| tier                 | 置き場所                                                                | import 元                  | 中身                                                                                                                                                      | 追加方法                                                                                            |
| -------------------- | ----------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **① プリミティブ**   | `packages/components/src/atoms/ui`                                      | `@stats47/components`      | shadcn/ui 由来の素部品（Button/Card/Select/Table/Tabs…30 個）                                                                                             | `cd packages/components && npx shadcn add`（`packages/components/README.md`）。app-local に置かない |
| **② 共有 composite** | `apps/web/src/components/{surface,charts,stat-charts,layout,molecules}` | `@/components/...`         | 複数 feature が使う合成部品（`SurfaceCard` / `ChartCard` / `PageShell` / `MiniCharts` / KPI カード等）。**これは正式な共有層**（実質 180+ import のハブ） | ① を組み合わせて作る。チャートは `chart-component-builder` agent                                    |
| **③ feature 固有**   | `apps/web/src/features/<feature>/components`                            | feature 内 `index.ts` 経由 | その feature だけで使う UI。複数 feature で必要になったら ② へ昇格                                                                                        | feature 内。**他 feature から直接 import しない**（app 層経由で合成）                               |

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
  - **例外: hero バナー内の h1**（色付き `HeroShell` / hero セクション内のキャッチコピー）は `text-2xl sm:text-3xl` のレスポンシブ大見出しを許容する。マーケ目的の意図的拡大であり、コンテンツ本文の h1（ranking/category 詳細・記事タイトル）とは役割が異なる。該当: `category/[categoryKey]`・`themes`・`survey/[surveyKey]`・`tag/[tagKey]`。**home `/` は 2026-07-23 のポータル型再設計で暗色 hero を撤去し `PageHeader`（`text-2xl`）に統一したため、この例外の対象外**（正典: `apps/web/src/features/home-portal/README.md`）。本文コンテンツの h1 では `text-2xl` を厳守する。

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

| 対象                                              | 使うべきブレイクポイント                  | 理由                                                         |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| ページレイアウト（2カラム/1カラム、右レール表示） | `xl:` (ビューポート 1280px)               | `PageShell` の右レール（316px）は `xl:` で出現               |
| テキスト・ボタンのサイズ調整                      | `sm:` / `md:` (ビューポート)              | デバイスサイズで決まる                                       |
| ダッシュボードカードグリッド                      | `@sm:` / `@md:` / `@lg:` (コンテナクエリ) | 親コンテナ幅が可変（右レール有無で本文カラム幅が変動）のため |

コンテナクエリのブレイクポイントは `tailwind.config.ts` でカスタム定義（`@sm: 480px`, `@md: 768px`, `@lg: 1024px`）。プラグインのデフォルト値とは異なるので注意。ビューポートブレイクポイントとコンテナクエリの混在は意図的な設計。カードグリッドをビューポートの `md:` に変えると右レールあり画面で幅不足になるため、必ずコンテナクエリを使うこと。

## ダッシュボードコンポーネント

- **KPI・チャート等は git 管理の `apps/web/scripts/data/page-components/` で管理する。** コード内にチャート定義をハードコードしない。専用 exporter で R2 snapshot へ反映する。
- 詳細は `.claude/design-system/page-components.md` を参照。
