---
paths:
  - "apps/web/src/{components,features,app}/**/*.tsx"
  - "docs/01_技術設計/04_デザインシステム.md"
  - ".claude/skills/ui/**"
  - ".claude/agents/{site-ux-manager,ui-*,ranking-ui-manager,theme-ui-manager}.md"
---
# UI コンポーネント規約

> デザインシステム全体の正典は `docs/01_技術設計/04_デザインシステム.md`。
> このファイルは Claude Code 向けの実装時メモであり、食い違う場合は docs 側を優先する。

## レイアウト・フォント・角丸（2026-06〜 / 正典: `docs/01_技術設計/04_デザインシステム.md`）

- **横幅は `PageShell` / `ArticleShell`（`@/components/layout`）経由で統一**。ページ内で `container mx-auto` や `max-w-[…]` を直書きしない。外枠は `PageShell.tsx`、ページ内ナビの置き場は `LeftRailLayout.tsx` を正典とする。**寸法**: コンテナ 1280px / 余白はルートレイアウトの `main#main-content` の `p-4`（16px。Shell 自身は余白を持たない）/ 列の gap 16px（`gap-4`）/ 縦の間隔 16px / 右レール **316px**（テンプレートの `p-4`・`gap-4` に寄せた。2026-10-27。それ以前は doboku-note に合わせた 40px）。`SHELL_WIDTH_CLASS` は幅（1280px 中央寄せ）だけを持ち、横の余白を持たない（2026-10-28。main の中で使うと main の `p-4` と重なっていた）。main の外にある `Footer` は自分で `px-4` を足す。**ページで唯一の `<main>` はルートレイアウトが持つ**。Shell の本文列は `div[data-slot=shell-main]` で、page や feature は `<main>` を描かない（`design-system:check` の `no-nested-main-landmark`）。300×250 の `SidebarPromoBanner` は Card で囲まず、レール内に等倍で表示する。**記事系ページ（blog 詳細 / ranking 詳細 / survey / terms / privacy）は `ArticleShell`**（reading zone + flex 密着）を使う。
- **骨組みはテンプレートのサイドバー型（2026-10-27 オーナー決定・2026-10-28 テンプレートの layout.tsx / app-sidebar.tsx に合わせ直し）**。ルートレイアウトの `SidebarProvider` の中に `AppSidebar` と `SidebarInset` を兄弟で置き、`SidebarInset` に `SiteHeader`・`main#main-content`・`Footer`・Cookie 同意の帯（`sticky bottom-0` の 1 行。浮きカードにしない）を並べる。lg（1024px）以上は常設、lg 未満は Sheet（`sidebar.tsx` が isMobile のときだけ React.lazy で読む）。Server Component（layout・`AppSidebar`）はサイドバー部品と `AdSenseScript` を `AppSidebar/sidebar-shell.tsx` から import する（RSC の参照を 1 モジュールに寄せる）。トースト（sonner の `Toaster`）は置かない（`toast()` の呼び出し 0 件）。
  - `AppSidebar` は `variant="inset"`、`SidebarInset` は `m-2 outline outline-border rounded-none!`（テンプレートと同じ）。`SiteHeader` の行と `AppSidebar` の `SidebarHeader` はどちらも `h-14` にして下線を一直線に揃える。
  - サイドバーの項目は非選択も `font-medium`、現在地は `bg-primary text-background`（`AppSidebarClient` の呼び出し側で当てる。`sidebar.tsx` の既定は変えない）。項目の行の高さはテンプレートの nav-items と同じ 1 行 40px（`h-9` + `my-0.5`）、主要ナビ・カテゴリ・テーマの系統の項目にはすべて lucide のアイコンを付ける（カテゴリは `categories.ts` の icon）。グループ名は `SidebarGroupLabel` の既定の見た目のまま使う。ヘッダーはロゴ + 名前（`text-base`）+ 副題 1 行の 2 段。
  - 主要ナビはサイトの内容の種類だけを並べ、常に展開する（ホーム・ランキング・テーマ・地域・地域分析・統計ブログ。2026-10-28 オーナー合意）。地域単位（47都道府県・市区町村）は項目にせず各ハブの `StatisticsScopeNav` で切り替え、調査（出典をたどる配線）と地域間比較（条件を選ぶツール）はフッターから入れる（`docs/01_技術設計/03_情報設計.md`「地理スコープ」）。テーマのグループ（`SidebarCollapsibleGroup`）を主要ナビの直後に置き、`THEME_NAV_GROUPS` の 5 系統を開閉できる項目（`SidebarCollapsibleItem`。テンプレートの nav-collapse）として既定で開く。カテゴリ 17 件のグループはテーマの後に置き、既定で閉じる（`defaultOpen={false}`。現在地を含むときは開く）。カテゴリの件数の札は出さない。下端（`SidebarFooter`）は置かない。閉じている間もリンクは `hidden="until-found"` で SSR の HTML に残す。
  - **カテゴリの一覧はサイドバーだけが持つ**。home / `/ranking` / `/category/*` の左レールにあったカテゴリ一覧（`RailCategoryList`）は撤去した（2026-10-27。`rail-contract-structure.test.ts` が再混入を止める）。
  - **例外: ページ内ナビ（旧 左レール）**。「そのページの表示内容を切り替えるナビ」は `PageShell` / `ArticleShell` の `leftRail` に渡してよい。Theme はグループ別テーマリンク + 地域 + 全指標 + 出典調査、survey は調査一覧 + このページ + 代表ランキング + 関連分類、`/areas` は地方の切替。Theme の「テーマ」「出典調査」には、それぞれ `/themes`・`/survey` の上位ハブリンクを1件置く。テーマの地域は「比較単位（47都道府県 / 市区町村 / 日本）」と「表示する都道府県」を分ける。テーマの表示グループは navigation-only SSOT `THEME_NAV_GROUPS` で管理し、ranking category / ThemeCatalog taxonomy と混ぜない。現在テーマのグループだけ初期展開する。
  - **ページ内ナビは列を作らず、どの幅でも本文の上に置く**（2026-10-28。サイト全体のナビがサイドバーにあるので、サイドバーの右へもう 1 本の列を作らない）。旧来の左レールの境界と、幅で隠す分岐・常に隠す代替 UI は撤去した（2026-10-28 2 巡目。`design-system:check` の `no-retired-left-rail-narrow-api` が再混入を止める）。パンくずと h1 は Shell の `header` に渡し、ページ内ナビより先に出す（`left-rail-requires-header-first`）。ページ内ナビは両 Shell とも**右レールと併用できない**。右レールが指定された場合は右を優先する。
  - **右レールの境界はビューポートではなく、Shell が名付けたコンテナ `@container/shell` の幅で決める**（2026-10-27。旧: `rightRailBreakpoint` の `lg` / `xl`、廃止）。右レールは `@min-[988px]/shell`（本文 656px + gap 16px + レール 316px）で、サイドバーを開いても畳んでも本文幅 656px を保つ。右レールの内側で表示を合わせる部品（レール専用の広告・探索導線とその狭幅版）は、ビューポートの `lg:` ではなく同じ `@min-[988px]/shell:` を使う。Surface・見出し・リンク行・余白の視覚契約は正典 04「レール UI 契約」。部品は `RailStack` / `RailCard` / `RailNavRow`。機械ゲート = `left-rail-layout-contract.test.tsx` + `page-shell-rail-contract.test.tsx` + `article-shell-left-rail-contract.test.tsx` + `check-design-system.mjs`。
  - 左レールが `ThemePrefectureProvider` のような context を使う場合、**Provider の内側に leftRail を置く**（`ThemePageLayout` が Provider → `PageShell` の入れ子を持ち、呼び出し側の page.tsx は `PageShell` を重ねない）。
- **テンプレート (shadcndashboard・Base UI 版 shadcn + style-lyra) を正とする（2026-10-27 オーナー決定）。** 部品は `packages/components/src/atoms/ui/` のテンプレート版を使い、色・`--radius` は `@stats47/ui-theme` (tokens-hsl.css) から来る。テンプレートの lyra の見た目 (`style-lyra.css` の `cn-*` 規則) は CSS として読まず、部品の className に書き込んである (`npm run ui-theme:lyra`。2026-10-28)。lyra の値は呼び出し側の className より後ろで合成され、CSS で読んでいたときと同じく呼び出し側に勝つ。上書きするときはテンプレートと同じく `!` を付ける (例: `pl-10!`)。Base UI に Radix の `asChild` は無い。子要素に描くときは `render` を使い、ボタンの見た目のリンクは `<Link data-slot="button" className={buttonVariants({...})}>` にする (`<Button render={<a/>}>` は role="button" になりリンクの役割が消える)。クライアントの `Select` は `items` (値と表示名) を渡す (渡さないと値そのものが出る)。状態のクラスは `data-pressed` / `data-active` / `data-open` (Radix の `data-[state=…]` は付かない。`shadcn-tailwind.css` の `data-open:` などの variant も Base UI の属性だけを見る。2026-10-28)。呼び出し側の素のクラス (`p-0`・`pl-8`・`bg-card` 等) は lyra の同じ性質の値に負ける。負けて効かないクラスは `design-system:check` の `lyra-dead-caller-class` が拒否する (apps/web と apps/admin。2026-10-28 に約 210 件を是正)。効かせるなら `!` を付け、要らないなら消す。ボタンの大きさは `!` でなく `size` で選ぶ。一方、親から子の要素を指定するクラス (`[&_td]:py-0` 等) は詳細度が高く、子の部品の lyra に勝つ (CSS で読んでいた頃は負けていた。2026-10-28 に負けていた 1 か所を外した)。`npm run ui-theme:lyra` が正本 `style-lyra.css` の規則を部品へ書き込み、`npm run ui-theme:lyra:test` が書き込み漏れ・組み立てを検査する (`.husky/pre-commit` と PR CI の static-gates で走る)。テンプレートの写しのうち呼び出し 0 件の見た目 (sidebar の `collapsible="icon"`・`variant="floating"`・`side="right"`、tabs の line・縦向き、toggle-group の縦向き、button の destructive) は CSS を減らすため外してある。使い始めるときは写しから戻し、差分一覧 (`packages/ui-theme/README.md`) を直す。`cn-*` は文字列のまま書き、テンプレートリテラルや連結で組み立てない。どこからも import されない atom は `apps/web/tailwind.config.ts` の content で `!` 除外する (一覧は `scripts/ui-theme/inline-lyra.mjs` の `UNUSED_ATOMS` と一致させる)。
- **カード外枠は角丸なし（`--card-radius: 0`）。値はトークンだけで決め、クラスを役割で選ぶ（2026-09-25）**:
  - カード外枠・その仮表示・地図/チャート枠 → `rounded-card`（`--card-radius`）。カード本体は `CARD_SURFACE_CLASS`（`@stats47/components`）を使い、`SurfaceCard` 系もこれを合成している
  - ボタン・ボタン風リンク・ドロップダウン → `rounded-md`、カード内の小タイル・バッジ・サムネ → `rounded-sm`（どちらも `--radius`）
  - 形として四角であるべきもの（凡例の色見本・タイル地図のマス・下線タブ・一覧行）だけ `rounded-none`。**円形のみ `rounded-full`**（アイコン背景・ピル・アバター）
  - **本文の中に置く部品**（callout・本文内のランキングカード・コードブロック）→ `rounded-content`（`--content-radius` = 6px）。レイアウトのカード外枠とは役割が別なので別トークン。使えるファイルは `check-design-system.mjs` の `ARTICLE_BODY_COMPONENT_FILES` に限り、そのファイルでは `rounded-card` / `rounded-lg` を使わない（`content-radius-only-in-article-body` / `article-body-parts-use-content-radius`）。callout の種類の定義は `callout-config.ts`、表示は `Callout.tsx`（左の色バーなし）
  - `rounded-xl`/`2xl`/任意値の手動付与は禁止。角丸を採用するときは `globals.css` のトークンと `check-design-system.mjs` の `no-nonzero-radius-token` 許容値を同じ差分で変える
- **カード外枠の線と地**: テンプレートと同じく、ページ地もカードも白 (`--background` / `--card`)、カード外枠は細い線 (`--card-outline` = `--border`)、影なし（2026-10-27）。
- **本文フォントは system スタック**（游ゴシック/Hiragino、Web フォント非依存）。Inter/Noto Sans JP は読み込まない（コードのみ Geist Mono）。

## Sticky aside の max-h 必須ルール（削除禁止）

CSS Grid (`lg:grid` + `items-start`) 内の `sticky` aside には **必ず `max-h-[calc(100vh-5.5rem)]` と `overflow-hidden` または `overflow-y-auto` を付ける**。

- **右レールは独立スクロールを作らない**。`ArticleShell` と `RightRailWidgets` は flex の自然フローで配置し、ページ本体のスクロールだけで全 widget に到達できるようにする。`max-h` と `overflow-y-auto`、それらを有効化する option は追加しない。
- Grid の行高 = 列のうち最も高い要素で決まる。aside に `max-h` がないと aside の自然高が行高を決定し、フッターが画面外に押し出される（記事本文の末尾でスクロール終了しているように見えてもフッターに届かない）。
- **削除した事例**: 2026-06-06、subagent が blog/category/ranking ページの aside から `max-h` を除去してフッターが非表示になった（commit `5d9afb24`、revert `a2c76216`・`b18be52a`）。

```tsx
// ✅ 必須パターン (3 カラムの grid で aside を追従させる場合)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20
                  lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden lg:pr-1">

// ✅ flex の右レールは自然フロー（内部スクロールなし）
<aside className="hidden w-[316px] shrink-0 @min-[988px]/shell:flex @min-[988px]/shell:flex-col @min-[988px]/shell:gap-3">

// ❌ sticky grid aside で max-h なしは禁止 (フッターが見えなくなる)
<aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20 lg:pr-1">
```

適用箇所:

- `apps/web/src/app/category/[categoryKey]/page.tsx` — 右 aside
- (ブログ詳細 `blog/[slug]/page.tsx` は `ArticleShell` の flex レールで、追従する aside を持たない。
  目次は 2026-09-25 に本文上部へ移し、レールの追従領域を廃止した)
- 3カラムレイアウトを持つすべての新規ページ

独立スクロール禁止の適用箇所:

- `apps/web/src/components/layout/ArticleShell.tsx`
- `apps/web/src/components/rail/RightRailWidgets.tsx`
- 右レールに渡す widget

## コンポーネント配置の 3 tier（新規コンポーネント追加前に必読・配置の SSOT）

新規 UI を作るときは、まず**どの tier に置くか**を決める。下位 tier に既にあるものを feature 内に再実装しない
（再実装が共通化を阻む最大要因。実測で feature 層の重複が散在 → 恒久ルールは `docs/01_技術設計/04_デザインシステム.md` に集約）。

| tier                 | 置き場所                                                                | import 元                  | 中身                                                                                                                                                      | 追加方法                                                                                            |
| -------------------- | ----------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **① プリミティブ**   | `packages/components/src/atoms/ui`                                      | `@stats47/components`      | shadcn/ui 由来の素部品（Button/Card/Select/Table/Tabs…30 個）                                                                                             | `cd packages/components && npx shadcn add`（`packages/components/README.md`）。app-local に置かない |
| **② 共有 composite** | `apps/web/src/components/{surface,charts,stat-charts,layout,molecules}` | `@/components/...`         | 複数 feature が使う合成部品（`SurfaceCard` / `StatTile` / `PageShell` / `MiniCharts` / KPI カード等）。**これは正式な共有層**（実質 180+ import のハブ） | ① を組み合わせて作る。チャートは `chart-component-builder` agent                                    |
| **③ feature 固有**   | `apps/web/src/features/<feature>/components`                            | feature 内 `index.ts` 経由 | その feature だけで使う UI。複数 feature で必要になったら ② へ昇格                                                                                        | feature 内。**他 feature から直接 import しない**（app 層経由で合成）                               |

判断フロー: 「① にあるか？ → ② にあるか？ → 無ければ作る（汎用なら ②、その feature 専用なら ③）」。

- **既存UIで目的を満たせる場合は新しいUIを作らない。** 同じカテゴリ・テーマ・地域選択を別の見た目で再実装せず、既存部品を共用する。
- **探索導線のクリック数を増やさない。** 表示領域に収まるリンク一覧は常時表示し、情報密度だけを理由に折りたたみや中間画面を追加しない。

- **`@stats47/components` の shadcn ベースコンポーネント（① プリミティブ）を最優先で使う。**
  Table / Card / Accordion / Select / Button 等が揃っている。素の HTML 要素（`<table>`, `<select>`, `<button>` 等）で実装せず、まず `packages/components/src/` に該当コンポーネントがないか確認すること。
- **Card は基底（① `Card` / ② `SurfaceCard`）から作る。** feature 内に独自カード枠を新規定義しない（Card 乱立の解消は Phase 0-1）。
- **本文の列は 1 本の線の格子（2026-10-28）。** Shell が見出し・ページ内ナビ・本文を `ShellColumn`（`PanelGrid`）に入れるので、ページは本文の直下にセル（パネル・格子・見出し・文章）を並べるだけでよい。パネルを並べる所は `PanelGrid` / `PageSections`（`@/components/layout`）で、列は `className` で渡す（例: `@md:grid-cols-2`）。見出しや文章とパネルを 1 つの `div` / `section` に包まない（パネルを含むセルは余白を持たないので文章が線に接する）。節は `PanelGrid as="section"` にする。`gap-4`・`space-y-6` でパネルを空けて並べると `design-system:check` の `panels-in-line-grid` が止め、描いた結果は `npm run ui-theme:line-grid -- <baseUrl>` で確かめる。右レールは格子の外。
- **カード内カードは禁止。** `SurfaceCard` / `SurfaceSection` / `SurfaceLinkCard` / `RailCard` / `ChartPanel` 等の外枠を相互にネストしない。外側を通常の `section` にするか、内側を border と shadow のない list / table / link row にする。`npm run design-system:check -w apps/web` の `no-nested-card-surfaces` が JSX 親子関係と `getSurfaceCardClassName` のネストを検査する。レール契約の機械ゲート = `rail-*` rule（`rail-contract-audit.mjs`）。
- **色付きの順位チップ（「N位」）は `RankBadge`（`@/components/atoms/RankBadge`）だけで描く。** 幅を固定せず最小幅で揃え、折り返さない（市区町村の「1741位」も伸びて収まる）。色は `tone`（`positive` / `negative`、向きのない順位は `rankToneByPosition(rank, total)`）で選ぶ。表のセル・補足の小さな文字・文章中の「N位」はチップにせず文字のまま書く。`design-system:check` の `rank-chip-must-use-rank-badge` が背景色つきの手書き「N位」を拒否する。
- **FAQ / 定義 / AI考察など本文の開閉 UI は `@/components/content` を再利用する。** 複数FAQ=`FaqSection`、単一本文=`ContentDisclosure`。feature 内の独自 Radix Accordion、`▼` / `▲` 文字、`text-lg` 見出しを追加しない。表示契約と機械ゲートの正典は `docs/01_技術設計/04_デザインシステム.md`。

## チャートコンポーネント（新規追加前に必読）

チャート・グラフを追加するときは先に **`.claude/rules/chart-component-standards.md`** のカタログを確認する。
既存の `MiniLineChart` / `MiniBarChart` / `StatTile` 等が使えるケースでは再実装しない。大きな数値 (KPI) は `StatTile` か `STAT_VALUE_CLASS`（`@/components/surface`）で描き、ページ側で文字の大きさを書かない（`stat-value-uses-shared-class`）。
部品の種類ごとの役割・枠・使わない場面の正本は部品の台帳 `data/design/components.json`（schema `config/schema/design.components.schema.json`）。登録済みの部品 (`StatTile`・`ChartPanel`) の props を変えたら同じ差分で台帳の `slots` を直す (`design-components-ledger.test.ts` が照合する)。1 指標の値は `stat-tile`、題名を持つ節・大きなチャート・指標の切り替えは `chart-panel`。推移の小さなチャートを出すかは部品ではなく呼び出し側が観測値と章の構成から決める (テーマは `features/theme-dashboard/lib/metric-trend.ts`)。指標ごとの表示フラグは持たない。
新規チャートが必要な場合は `chart-component-builder` agent に設計を依頼する。
規約違反の検出は `/audit-chart-components` スキルで実行する。

- **ページ見出し（h1）は `PageHeader`（`@/components/layout`）で描き、`text-xl font-semibold`（テンプレートの breadcrumb-comp と同じ）に統一する**（2026-10-27 にテンプレートへ寄せた。それ以前は `text-2xl font-bold`）。ページや feature に別の大きさの h1 を書かない。
  - **例外**: 記事本文のタイトル（blog 詳細の `.article-title`。読み物の見出しとして `globals.css` が大きさを持つ）と `not-found` の大見出し。`HeroBanner`（`text-2xl sm:text-3xl`）は現在どのページからも使われていない（使うときはこの例外に足す）。

## melta-ui デザインシステム準拠

詳細は `.claude/design-system/prohibited.md` を参照。以下は特に重要な禁止項目:

- `text-black` 禁止 → `text-foreground`
- `shadow-lg` / `shadow-2xl` 禁止 → `shadow-xs`（デフォルト。v4 の名前で、v3 の `shadow-sm` に当たる）/ `shadow-md`（hover）
- `tracking-tight` 禁止 → 日本語の可読性低下のため削除
- カラーバー（`border-t-4`, `border-l-4` + 色付き）禁止 → 全周 `border` で統一
- `text-gray-400` を本文に使用禁止 → `text-muted-foreground`
- **生パレット色（`slate-500` / `emerald-600` 等）を UI に直書きしない** → 意味トークン（`foreground` / `muted-foreground` / `border` / `positive` / `negative` / `warning` / `info` と各 `-soft`）。カテゴリ・性別・メダル等の識別配色だけ `*.palette.ts` に集める。`design-system:check` の `no-raw-palette-color` が web と packages/components・visualization を検査する
- カード hover: `hover:shadow-md` まで（`hover:shadow-lg` 禁止）

デザインレビュー: `/design-review` スキルで違反チェック可能

## レスポンシブブレイクポイントの使い分け

| 対象                                              | 使うべきブレイクポイント                  | 理由                                                         |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| ページレイアウト（右レールの表示） | `@min-[988px]/shell:` (名前付きコンテナ) | サイドバーの開閉で本文幅が変わるため。値は `PageShell` / `ArticleShell` だけが持つ (ページ内ナビは列を作らないので境界を持たない) |
| テキスト・ボタンのサイズ調整                      | `sm:` / `md:` (ビューポート)              | デバイスサイズで決まる                                       |
| ダッシュボードカードグリッド                      | `@sm:` / `@md:` / `@lg:` (コンテナクエリ) | 親コンテナ幅が可変（右レール有無で本文カラム幅が変動）のため |

コンテナクエリのブレイクポイントは `apps/web/src/app/globals.css` の `@custom-variant` でカスタム定義（`@sm: 480px`, `@md: 768px`, `@lg: 1024px`）。Tailwind v4 の既定値（24 / 28 / 32rem）とは異なるので注意。テーマ値（`--container-*`）を変えると `max-w-sm/md/lg` まで変わるため、variant だけを上書きしている。ビューポートブレイクポイントとコンテナクエリの混在は意図的な設計。カードグリッドをビューポートの `md:` に変えると右レールあり画面で幅不足になるため、必ずコンテナクエリを使うこと。

### Tailwind v4 で v3 と挙動が変わる書き方（2026-10-06 移行時の実測）

- **`space-y-*` / `divide-y` は「最後以外の子の下」に付く**（v3 は「最初以外の子の上」）。先頭の子が絶対配置（`sr-only` の見出し等）だと、その余白はレイアウトに効かない。先頭に `sr-only` を置く場合は親に `pt-*` を明示する（例: `ThemeMetricsDashboard`）。
- **`leading-*` は画面幅別の `text-*` に負けない**。v3 では `md:text-xl` の行の高さが基本の `leading-none` に勝っていた。画面幅別に文字サイズを変えるなら、同じ幅の `leading-*` も書く（例: `md:text-xl md:leading-7`）。
- **クラス文字列を置く場所は `tailwind.config.ts` の `content`（`src/**` と packages の components・visualization）に入れる**。走査外のファイルにしか無いクラスは CSS が生成されない。

選択 UI と集合（grid）の 0/1/2+ 件数規則は `docs/01_技術設計/04_デザインシステム.md`「選択 UI と集合レイアウトの件数規則」が正典。テーマ実装は `SingleMetricCard`（1 件）/ `MetricSwitcherPanel`（2 件以上）を使い分ける。

## ダッシュボードコンポーネント

- **KPI・チャート等は git 管理の `apps/web/scripts/data/page-components/` で管理する。** コード内にチャート定義をハードコードしない。専用 exporter で R2 snapshot へ反映する。
- 詳細は `.claude/design-system/page-components.md` を参照。
