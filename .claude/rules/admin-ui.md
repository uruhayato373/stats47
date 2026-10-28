---
paths:
  - "apps/admin/**"
  - ".claude/scripts/admin-ui/**"
  - ".claude/config/admin-ui-debt-baseline.json"
---
# 管理画面 (apps/admin) の UI 規約 (2026-10-28 改訂)

管理画面は公開サイトと**同じ部品と同じテーマ**を使う。部品は `@stats47/components`、色・角丸は `@stats47/ui-theme`。
部品の仕様 (余白・文字・線の格子) の正典は `docs/01_技術設計/04_デザインシステム.md`「見本の実測値と部品の仕様」。

**2026-10-28 オーナー決定**: 「可能な限り集約してコードとルールを少なくしたい」。2026-10-27 の「管理画面は web から独立・
`@stats47/components` を admin に入れない・shadcn 公式 (base-nova) の写しを `components/ui` に持つ」を取り消した。
`components/ui`・`hooks/use-mobile.ts`・`lib/cn.ts`・`components.json`・shadcn 公式との一致検査 (`check-shadcn-parity`) と
公式ソースの写し (`.claude/config/shadcn-reference/`) は削除した。

## 構成

| 層 | 置き場 | 中身 |
|---|---|---|
| 土台 | `apps/admin/app/globals.css` | 公開サイトと同じ順で `@stats47/ui-theme/{base,tokens-hsl,theme}.css` を読み、`@source` で `packages/components/src` を拾う。色は HSL 3 値なので、CSS や JS で直接使うときは `hsl(var(--x))` で包む |
| 部品 | `@stats47/components` | Button・Badge・Card・Table・Sidebar・NativeSelect など。`StatTile`・`SectionCard`・`PanelGrid` も同じ所から |
| 組み立て部品 | `apps/admin/components/admin-ui/` | `StatCard` (StatTile に tone・trend を足す)・`PanelCard` (SectionCard に description を足す)・`TrendChart` (+ 公式 `chart.tsx` の写し。recharts は管理画面だけが持つ)・`DataGrid` / `DataTable` (TanStack)・`TableFrame`・`LinkCard`・`StatusBadge` |
| 並べ方 | `apps/admin/components/layout-primitives.tsx` | `Stack` / `Grid` / `Section`。`Grid` は既定で `PanelGrid` (線の格子)。カード以外を並べるときは `lines={false}` |
| ナビ | `apps/admin/lib/nav-registry.ts` (SSOT) | メニュー・現在地の判定。`tests/unit/nav-registry.test.ts` がページの実在を止める |

## 決まり

1. **共有部品を管理画面で写さない・variant を足さない。** 足りない部品は `packages/components/src/atoms/ui/` に足して `index.ts` から export する。
   lyra の値 (`/* lyra */`・`// lyra:begin`〜`// lyra:end`) は `npm run ui-theme:lyra` の生成物なので手で直さない。
   lyra は呼び出し側の className より後ろで合成されるので、上書きが要るときは `!` を付ける (例: `StatusBadge` の状態色)。
2. **状態の色は `theme.css` の `positive` / `warning` / `negative` / `info` (と `-soft`) だけ。** 生の緑・黄を直書きしない。状態は `StatusBadge`、数値は `StatCard` の `tone`。
3. **ボタンの見た目のリンクは `<Link className={buttonVariants(...)}>`。** `<Button nativeButton={false} render={<a />}>` は `<a>` に `role="button"` が付くので使わない。Base UI に `asChild` は無く、差し替えは `render`。
4. **Card を入れ子にしない。** `PanelCard` / `LinkCard` / `Card` の中に `Card` / `StatCard` を置かない (`apps/web` の `design-system:check` が admin も走査して止める)。
5. **自作 CSS は `@layer base` に入れる。** v4 はユーティリティを `@layer utilities` に置くため、レイヤー外の CSS は詳細度に関係なく勝つ。
6. **ページに生のカード・表・style を増やさない。** 生の `card` / `badge` クラス・`<table>`・`style={{…}}`・`text-[11px]` などの任意値・`<details>`・リンクとして描く Button は
   `.claude/config/admin-ui-debt-baseline.json` (縮小専用・全項目 0) を超えると止まる。

## 機械検査

| コマンド | 内容 |
|---|---|
| `npm run admin-ui:check` | `check-admin-ui-debt` (上の 6) |
| `npm run admin-ui:test` | その単体テスト |
| `npm run design-system:check -w apps/web` | 入れ子のカードなど公開サイトと共通の規則 (admin も走査) |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の `admin-ui-debt`。

## 移行の履歴

- 2026-09-30: Tailwind v4 + shadcn 公式部品 (new-york-v4)。手組みのカード面・表・style を 130 → 0。
- 2026-10-27: base-nova (Base UI) へ移し、見本 shadcndashboard.dev の見た目にそろえた (ADMIN-UI-BASEUI-01)。
- 2026-10-28: 公開サイトと同じ `@stats47/components` / `@stats47/ui-theme` へ集約し、管理画面専用の部品の写し・トークン・一致検査を削除した。
