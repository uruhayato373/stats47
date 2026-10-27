---
paths:
  - "apps/admin/**"
  - ".claude/scripts/admin-ui/**"
  - ".claude/config/shadcn-reference/**"
  - ".claude/config/shadcn-parity-allow.json"
  - ".claude/config/admin-ui-debt-baseline.json"
---
# 管理画面 (apps/admin) の UI 規約 (2026-09-30)

`apps/admin` は web (Tailwind v3・`@stats47/components`) から**独立**させる。
部品はテンプレート [shadcndashboard/next-shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard) (MIT・Base UI 版 shadcn の base-nova + style-lyra) のソースをそのまま使い、画面は共通の組み立て部品から作る (2026-10-27 オーナー決定「テンプレートを正としてサイトを寄せる」)。色・角丸・部品の見た目は `@stats47/ui-theme` (`packages/ui-theme/`) を web と共有する。

## 構成

| 層 | 置き場 | 中身 |
|---|---|---|
| 土台 | `apps/admin/app/globals.css` | Tailwind **v4** (CSS-first)。`@import "@stats47/ui-theme"` (テンプレートの色・角丸トークン + lyra スタイル。`<html class="style-lyra">` で効く) と管理画面固有の `console-*`、`@custom-variant dark`、v3 互換 (cursor・行高) |
| 公式部品 | `apps/admin/components/ui/*.tsx` (+ `hooks/use-mobile.ts`) | テンプレートの Base UI 版をそのまま。変えてよいのは import 先 (`@/lib/utils` → `@/lib/cn`) だけ。足すときは `node .claude/scripts/admin-ui/sync-shadcn-reference.mjs <name> --install` |
| 並べ方 | `apps/admin/components/layout-primitives.tsx` | `Stack` / `Grid` / `Section` (`id` = ページ内リンクの着地・`count` = 見出し横の件数)。部品は外側の余白を持たず、間隔は親の `gap` が決める |
| 組み立て部品 | `apps/admin/components/admin-ui/` | `TableFrame` (表の枠)・`DataTable` + `Row` / `Cell` (見出し行つきの一覧)・`PanelCard` (題名つきの区画)・`StatCard` (数値タイル)・`StatusBadge` (状態: good/warn/bad/info/neutral)・`LinkCard` (リンクになるカード)。ページはここと `components/ui/*` から組む |
| ナビ | `apps/admin/lib/nav-registry.ts` (SSOT) + `lib/channel-registry.ts` + `components/console-nav*.tsx` | メニューの定義と現在地の判定は純モジュール。グループは事業の役割 (商品・SNS・制作・資産・戦略…)。チャネルは最上位に並べず、商品・SNS の「チャネル別」の枝 (折りたたみ・現在地を含む枝だけ開く) に channel-registry から入れる。表示は公式 `Sidebar` (md 未満は Sheet)。`tests/unit/nav-registry.test.ts` が「全項目のページが実在する」を止める |
| グラフ色 | `apps/admin/components/dashboard/chart-tone.ts` | `ChartTone` → `text-console-*` / `fill-console-*` のクラス。SVG は `currentColor`・幅は属性で決め、`style` を使わない |
| 正の保存物 | `.claude/config/shadcn-reference/*.tsx` | テンプレートの固定コミット (`sync-shadcn-reference.mjs` の `TEMPLATE_SHA`) の写し (CI がネットワークに依存しないため)。手編集しない |

## 契約

1. **正 (テンプレート) と同じクラスにする。** 意図した差だけを `.claude/config/shadcn-parity-allow.json` に**理由付き**で登録する (現在は Badge の状態用 `success` / `warning` / `info` / `danger` の 4 件)。
   差が無くなった例外は検査が知らせるので消す。部品を足すときは `npm run admin-ui:sync-reference -- <name>` で公式を取ってから `components/ui/` に置く。
2. **大きさはページで上書きしない。** `<Badge>` `<Button>` `<TabsTrigger>` の文字サイズ・高さ・余白を `className` で変えず、`variant` / `size` で選ぶ。
3. **ページに生のカード面・表・style を増やさない。** `bg-console-card` を使ったカード面の手組み、生の `<table>`、`style={{…}}`、`className="card|badge"` は
   `components/ui/card`・`PanelCard`・`TableFrame`・`StatusBadge` へ置き換える。ページごとの件数を `.claude/config/admin-ui-debt-baseline.json` に固定し、
   **増えたら止める・減ったら `--update` で下げる (縮小専用)**。新規ページは 0 件にする。**2026-09-30 に全項目 0 件へ到達済み**で、以後は「0 を保つ」検査になる。
4. **状態の色は `StatusBadge`。** `console-good/warn/info/bad` (light/dark でコントラスト AA を実測して選定済み) を使い、生の緑・黄を直書きしない。
5. **自作 CSS は `@layer base` に入れる。** v4 はユーティリティを `@layer utilities` に置くため、レイヤー外の CSS は詳細度に関係なく勝つ
   (`a { color: inherit }` が `text-console-accent` を潰してリンクが黒くなった実例。2026-09-30)。
6. **Card を入れ子にしない。** `PanelCard` / `LinkCard` / `Card` の中に `Card` / `StatCard` を置かない (`apps/web` の `design-system:check` が admin も走査して止める)。
   個々を `Card` で並べる区画は外側を `Section` (layout-primitives) にし、リンクカードの下に数値タイルを並べたいときは兄弟として置く。
7. **`@stats47/components` を admin に入れない。** web 向け (v3) の旧世代部品で、v4 の公式部品と混ぜると見た目が食い違う。

## 機械検査

| コマンド | 内容 |
|---|---|
| `npm run admin-ui:check` | `check-shadcn-parity` (公式との差・ページでの大きさ上書き) + `check-admin-ui-debt` (生のカード面/表/style/badge のラチェット) |
| `npm run admin-ui:test` | 上の 2 検査の単体テスト |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の `admin-shadcn-parity` / `admin-ui-debt`。

## 新しい画面・部品を足すとき

1. 画面は `PanelCard` / `TableFrame` / `DataTable` / `StatCard` / `StatusBadge` / `LinkCard` / `Stack` / `Grid` / `Section` と公式部品から組む。
   フォームは公式の `Input` / `NativeSelect` (サーバー描画の GET フォーム向け) / `Button`、注記は `Alert`、
   ボタンの見た目のリンクは `<Link href=… data-slot="button" className={buttonVariants({ variant: "outline" })}>`。
   `<Button render={<Link />}>` にしない (Base UI の Button が role="button" を付け、リンクとして読み上げられなくなる)。
   Base UI は Radix の `asChild` を持たない。リンク以外で子要素として描きたい要素 (SheetTrigger の中の Button 等) は `render` に渡す。
   クライアントの `Select` は `items` (値と表示名の組) を渡す。渡さないと選択欄に値そのものが出る。値の変更は `null` を受ける。
2. `npm run admin-ui:check` を通し、light / dark の両方で見た目を確認する。
3. メニュー項目を足す・URL を変えるときは `lib/nav-registry.ts` だけを編集する (テストがページの実在を確かめる)。
4. `ops/primitives.tsx` には `PageHeading` / `ErrorNote` / `Unmeasured` / `Freshness` だけが残る。表・数値タイル・状態・区画は上の共通部品を使う。

## 移行の履歴

2026-10-27: 部品をテンプレートの Base UI 版 (base-nova + style-lyra) へ全面置換し、色・角丸をテンプレートの値に (`@stats47/ui-theme`)。Radix を外し、`asChild` 24 か所を `render` へ、Select 3 か所に `items` を追加。

2026-09-30: Tailwind v4 + 公式部品の土台、`/content/note/covers`・`/content/references` (手作業)、旧 `ops/primitives` の Section/Stat/Badge/Table/Td/Tr を
共通部品へ置換 (20 ファイル)、残り 30 ファイルの手組みカード面・表・style を解消、ナビを公式 Sidebar へ。手組みの件数は 130 → 0。
