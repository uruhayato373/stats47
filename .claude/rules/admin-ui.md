---
paths:
  - "apps/admin/**"
  - ".claude/scripts/admin-ui/**"
  - ".claude/config/shadcn-reference/**"
  - ".claude/config/shadcn-parity-allow.json"
  - ".claude/config/admin-ui-debt-baseline.json"
---
# 管理画面 (apps/admin) の UI 規約 (2026-10-27 改訂)

`apps/admin` は web (Tailwind v3・`@stats47/components`) から**独立**した管理画面。
部品は shadcn/ui 公式 **base-nova (Base UI)** のソースをそのまま使い、見た目は**見本 [shadcndashboard.dev](https://demos.shadcndashboard.dev/) (2026-10-27 実測)** にそろえる。
独自部品は作らず、画面は下の組み立て部品と公式部品から組む。

2026-10-27 に new-york-v4 (Radix) から base-nova (Base UI) へ移した (shadcn は 2026-07 から新規の既定を Base UI にした: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)。
doboku-note の `tools/admin-app` はまだ Radix のままで、この時点から構成が違う。

## 構成

| 層 | 置き場 | 中身 |
|---|---|---|
| 土台 | `apps/admin/app/globals.css` | Tailwind **v4**。`tw-animate-css` と `shadcn/tailwind.css` (`data-open` / `data-horizontal` などの variant) を読み込む。shadcn トークンは公式 v4 の形 (`:root` / `.dark` に完全な色の値・`@theme inline` で参照) で、値は **neutral テーマ**。フォントは Geist (`geist` パッケージ・日本語は OS のゴシック) |
| 公式部品 | `apps/admin/components/ui/*.tsx` (+ `hooks/use-mobile.ts`) | shadcn/ui 公式 (base-nova) をそのまま。変えてよいのは import 先 (`cn` → `@/lib/cn`・registry の別名 → admin の alias・`IconPlaceholder` → lucide) だけ。足すときは `node .claude/scripts/admin-ui/sync-shadcn-reference.mjs <name> --install` (取得と変換を公式 CLI と同じ結果で行う) |
| 並べ方 | `apps/admin/components/layout-primitives.tsx` | `Stack` / `Grid` / `Section`。`Grid` は既定でカードが 1px の線を共有して並ぶ (見本と同じ見た目。外枠の上・左とセルの右・下に線を引くので、空きマスも白地のまま)。カード以外を並べるときは `lines={false}` |
| 組み立て部品 | `apps/admin/components/admin-ui/` | `StatCard` (数値タイル)・`TrendChart` (推移のチャート)・`DataGrid` (並べ替え・検索・絞り込み・ページ送りの一覧・TanStack)・`DataTable` + `Row` / `Cell` (静的な表)・`TableFrame`・`PanelCard` (見出し行つきの区画)・`LinkCard`・`StatusBadge` |
| 外枠 | `app/layout.tsx` + `components/console-nav*.tsx` + `components/site-header.tsx` | inset の Sidebar (白地 + 1px 枠の箱・選択中は主色で塗る)・角の無い 1px 枠の本文・sticky の上部バー (サイドバー開閉・現在地の Breadcrumb・配色切替)・本文は `p-4 gap-4` |
| ナビ | `apps/admin/lib/nav-registry.ts` (SSOT) + `lib/channel-registry.ts` | メニューの定義・現在地の判定 (`isNavItemActive`)・上部バーの現在地 (`navTrail`) は純関数。チャネルは商品・SNS の「チャネル別」の枝 (`Collapsible`)。`tests/unit/nav-registry.test.ts` が「全項目のページが実在する」「現在地が自分を指す」を止める |
| 公式の保存物 | `.claude/config/shadcn-reference/*.tsx` | 公式ソースの写し (CI がネットワークに依存しないため)。手編集しない |

## 見本の実測値 (shadcndashboard.dev・2026-10-27)

| 対象 | 値 | 実装 |
|---|---|---|
| カード | 角 0・影なし・格子では 1px の線を共有・余白 16px | `ui/card.tsx` の角丸を外す (parity の例外に理由付きで登録)・`Grid` |
| パネルの見出し | アイコン (16px・muted) + 題名 16px medium、下に 1px の線、右に操作 | `PanelCard` / `TrendChart` の `icon`・`action` |
| 数値タイル | 名前 14px・右上に枠付きアイコン (`p-2.5 rounded-md outline`)・値 24px semibold・増減 (緑/赤 14px) + 補足 (muted) | `StatCard` の `icon`・`trend`・`sub` |
| 表 | 見出しは塗らない・14px muted・セル余白 12px × 16px・行は下線 | `headCell` / `bodyCell` (`DataTable` / `DataGrid` が使う) |
| チャート | 主色 (黒) の濃淡の単色 | `--chart-1〜5` (neutral の濃淡)・2 本以上は凡例 |
| サイドバー | 白地の箱に 1px 枠・ロゴ行の下に線・選択中は主色で塗った角丸 | `console-nav*.tsx` |

## ページの型と並べ方

先頭は必ず `PageHeading` (題名と真実源)。ページは `<>…</>` で区画を並べるだけにし、外側に `space-y-*` の包みを置かない (縦の間隔は外枠の `gap-4`)。

| 型 | 例 | 並べ方 |
|---|---|---|
| A 概況 | `/`・`/dashboard`・`/revenue`・`/affiliate`・`/content`・`/quality`・`/ops` | 数値タイル (`StatCard` を `<Grid min="sm">`) → 推移があれば `TrendChart` (`<Grid min="lg">` で 2 枚まで横並び) → 区画・表 |
| B 一覧・キュー | `/todo`・`/ops/workflows`・`/ops/agents`・`/quality/page-audit`・`/content/references` 等 | 件数の要約 (`StatCard`) → 推移があれば `TrendChart` → 一覧は `DataGrid` (状態は `facets`、要対応の行は `tone`) |
| C 詳細 | `/sns/[id]`・`/domains/[id]` | 見出し → `PanelCard` を `<Grid min="lg">` で 2 列。切り替えて見る塊は `Tabs` |
| D 文書 | `/strategy`・`/strategy/doc/[id]`・`/docs` | 本文は `PanelCard` の中。長い付録は `Collapsible` |
| E 制作ツール | `/buzz-map`・`/ops/image-*`・`/content/note/covers` | 道具の操作は保ち、見出し・区画・色・文字サイズだけこの規約にそろえる |

部品の選び方:

- 数値 1 つ → `StatCard` (`icon` に lucide の要素を渡す)。前週比などは `trend={{ label: "+12%", direction: "up" }}` (減るほど良い量は `tone: "good"` で逆にする)
- 週・日・月で 3 点以上の時系列 → `TrendChart` (`kind` area / bar / line・`valueFormat`・`ranges`)。表だけで推移を見せない。元の表は近くに残す
- 割合・進捗 → 公式 `Progress`
- 20 行を超える・並べ替えたい一覧 → `DataGrid`。20 行以下の静的な表 → `DataTable`
- 題名つきの箱 → `PanelCard` (`icon`・`action`)。見出しと注記だけのまとまり → `Section`
- リンクのカード → `LinkCard` (`title` / `value` / `sub` で数値タイルと同じ形)
- 状態 → `StatusBadge`。折りたたみ → `Collapsible`。切り替え → `Tabs`。フォーム → `Input` / `NativeSelect` / `Button`
- ボタンの見た目のリンク → `<Link href="…" className={buttonVariants({ variant: "outline", size: "sm" })}>` (公式文書の形)。
  `<Button nativeButton={false} render={<a />}>` は使わない: Base UI の Button は `<a>` に `role="button"` を付け、リンクがボタンとして読まれる
  (2026-10-27 に 23 か所で実測。e2e の `getByRole('link')` も見つけられない)。`check-admin-ui-debt` の `buttonAsLink` が止める。
  Base UI に `asChild` は無い。リンク以外の差し替え (`SheetTrigger render={<Button />}` 等) は `render` を使う

色と文字:

- 文字・面・線の色は shadcn のトークンだけを使う (`text-muted-foreground`・`bg-muted`・`bg-card`・`border`・`text-primary`)。`console-fg` / `console-muted` / `console-border` / `console-accent` / `console-card` / `console-bg` は使わない
- 状態の色 `console-good` / `console-warn` / `console-bad` / `console-info` / `console-neutral` は状態の意味があるときだけ (`StatusBadge`・`StatCard` の `tone` が基本)。チャートの系列には使わない
- 文中のリンクは `font-medium underline-offset-4 hover:underline` (色を付けない)
- 文字サイズは Tailwind の段 (`text-xs` / `text-sm` / `text-base` / `text-lg` / `text-2xl`) だけ。`text-[11px]` などの任意値は使わない。コード・パスは `font-mono text-xs`

## 契約

1. **公式と同じクラスにする。** 意図した差だけを `.claude/config/shadcn-parity-allow.json` に**理由付き**で登録する
   (Badge の状態用 `success` / `warning` / `info` / `danger` と、Card の角を直角にする 3 件)。差が無くなった例外は検査が知らせるので消す。
2. **大きさはページで上書きしない。** `<Badge>` `<Button>` `<TabsTrigger>` の文字サイズ・高さ・余白を `className` で変えず、`variant` / `size` で選ぶ。
3. **ページに生のカード面・表・style を増やさない。** `bg-console-card` の手組み、生の `<table>`、`style={{…}}`、`className="card|badge"` は
   公式部品と組み立て部品へ置き換える。ページごとの件数を `.claude/config/admin-ui-debt-baseline.json` に固定し、増えたら止める (縮小専用・全項目 0 を保つ)。
4. **状態の色は `StatusBadge`。** 生の緑・黄を直書きしない。
5. **自作 CSS は `@layer base` に入れる。** v4 はユーティリティを `@layer utilities` に置くため、レイヤー外の CSS は詳細度に関係なく勝つ。
6. **Card を入れ子にしない。** `PanelCard` / `LinkCard` / `Card` の中に `Card` / `StatCard` を置かない (`apps/web` の `design-system:check` が admin も走査して止める)。
7. **`@stats47/components` を admin に入れない。** web 向け (v3) の旧世代部品で、公式部品と混ぜると見た目が食い違う。

## 機械検査

| コマンド | 内容 |
|---|---|
| `npm run admin-ui:check` | `check-shadcn-parity` (公式との差・ページでの大きさ上書き) + `check-admin-ui-debt` (生のカード面/表/style/badge のラチェット) |
| `npm run admin-ui:test` | 上の 2 検査と `sync-shadcn-reference` (IconPlaceholder の変換) の単体テスト |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の `admin-shadcn-parity` / `admin-ui-debt`。

## 新しい画面・部品を足すとき

1. 上の「ページの型と並べ方」に沿って組み立て部品と公式部品から組む。`npm run admin-ui:check` を通し、light / dark とスマホ幅で見た目を確かめる。
2. メニュー項目を足す・URL を変えるときは `lib/nav-registry.ts` だけを編集する (テストがページの実在を確かめる)。
3. `ops/primitives.tsx` には `PageHeading` / `ErrorNote` / `Unmeasured` / `Freshness` だけが残る。

## 移行の履歴

- 2026-09-30: Tailwind v4 + 公式部品 (new-york-v4) の土台。手組みのカード面・表・style を 130 → 0。ナビを公式 Sidebar へ。
- 2026-10-27: base-nova (Base UI) へ移し、見本 shadcndashboard.dev の見た目 (neutral・Geist・直角のカード・単色のチャート) と並べ方 (5 つの型) にそろえた (ADMIN-UI-BASEUI-01)。
