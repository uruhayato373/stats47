# @stats47/ui-theme

テンプレート [shadcndashboard/next-shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)
(MIT・commit `91deb102`) の見た目を、公開サイト (`apps/web`) に持ち込む CSS。
2026-10-27 のオーナー決定「テンプレートを正としてサイトを寄せる」による。
管理画面 (`apps/admin`) も公開サイトと同じくこのパッケージ (base.css → tokens-hsl.css → theme.css) と `@stats47/components` を使う (2026-10-28 オーナー決定。`.claude/rules/admin-ui.md`)。

| ファイル | 中身 | 出どころ |
|---|---|---|
| `base.css` | 入口。`shadcn-tailwind.css` と tw-animate を読み、`style-lyra` の variant を定義する | — |
| `shadcn-tailwind.css` | `data-open:` などの追加の書き方とアコーディオンの動き | npm `shadcn@4` の `dist/tailwind.css` (MIT) |
| `style-lyra.css` | Base UI 部品の `cn-*` クラスの見た目 (正本・手で直さない)。**CSS としては読まない**。規則の中身を部品の className に書き込む (`npm run ui-theme:lyra` = `scripts/ui-theme/inline-lyra.mjs`。`npm run ui-theme:lyra:test` が書き込み漏れ・`cn-*` の組み立てを検査し、`.husky/pre-commit` と PR CI の static-gates で走る) | テンプレート `app/css/styles/style-lyra.css` |
| `style-reference.css` | 見本サイト (demos.shadcndashboard.dev) とテンプレートの lyra が食い違う値だけの差分 (正は見本。仕様は `docs/01_技術設計/04_デザインシステム.md`「見本の実測値と部品の仕様」)。形は `style-lyra.css` と同じで、`npm run ui-theme:lyra` が lyra の後に重ねて (tailwind-merge で同じ性質を置き換え) 部品へ書き込む。lyra に無い規則への差分は止める。2026-10-28: パネル (`cn-card` の文字 14px・`cn-card-title` 16px / 22px・`cn-card-description` 14px) | 自作 (見本の実測) |
| `tokens.css` | 色・角丸のトークン (テンプレートの oklch の値そのまま) | テンプレート `app/globals.css` |
| `tokens-hsl.css` | `tokens.css` と同じ色の HSL 3 値 (生成物・手で直さない) | `build-hsl-tokens.mjs` |

## 使い方

```css
@import "tailwindcss";
@import "@stats47/ui-theme/base.css";
@import "@stats47/ui-theme/tokens-hsl.css";
```

サイトは色を `hsl(var(--x))` の形で参照するので、oklch のままの `tokens.css` ではなく `tokens-hsl.css` を読む。
ルート要素 (`<html>`) にはテンプレートと同じく `class="style-lyra"` を付ける (lyra の見た目は className に書き込んであるので、このクラスには依存しない)。部品 (`packages/components/src/atoms/ui/*.tsx`) は
テンプレートの同じコミットの `components/ui/` の写しで、変えたのは import 先と、各ファイル先頭に書いたサイト固有の追加だけ。

## 部品の写しとテンプレートの差 (一覧)

テンプレートを取り直すときは同じコミットの `components/ui/` から写し、下の差を当て直す。各ファイルの先頭のコメントが同じ内容を持つ。
「呼び出し 0 件の見た目を外した」差は、Tailwind がソースに書かれたクラスを全部 CSS に出すため、使わない見た目の分だけ
全ページの CSS が重くなるのを止めるもの (2026-10-28 配信サイズの点検)。使い始めるときはテンプレートの写しから戻し、ここを直す。

| 部品 | 差 |
|---|---|
| `sidebar.tsx` | 1. PC 表示の境界を md から lg (1024px) に変えた。2. `SidebarInset` を main ではなく div で描く。3. 開閉状態を cookie に書く処理を外した (SSG 維持)。4. 狭い画面の Sheet を React.lazy で読む。5. `SidebarMenuButton` の tooltip 付きの分岐 (Base UI の Tooltip) を React.lazy で読む。6. 呼び出し 0 件の `collapsible="icon"`・`variant="floating"`・`side="right"` の見た目を外した |
| `tabs.tsx` | 呼び出し 0 件の `TabsList variant="line"` と縦向き (`orientation="vertical"`) の見た目を外した |
| `toggle-group.tsx` | 呼び出し 0 件の縦向き (`orientation="vertical"`) の見た目を外した |
| `button.tsx` | 呼び出し 0 件の `variant="destructive"` を外した |
| 使われる atom 全部 (`badge`・`breadcrumb`・`button`・`card`・`checkbox`・`dropdown-menu`・`empty`・`input`・`label`・`select`・`sheet`・`skeleton`・`slider`・`table`・`tabs`・`toggle`・`toggle-group`・`tooltip`) | 同じ要素の `cn-*` 規則 (`style-lyra.css` の `@apply`) が同じ性質を別の値で決めている base-nova の素のクラス (例: `rounded-xl`・`rounded-4xl`・`rounded-[min(var(--radius-md),10px)]`・`text-sm`・`focus-visible:ring-3`・`bg-card`) を消し (2026-10-28 3 巡目・96 件)、続けて `cn-*` 規則の `@apply` の中身を部品の className へ書き込んだ (2026-10-28 CSS-3。下の「lyra の書き込み方」)。`cn-*` の名前は目印として残す。取り直したときは写した後に `npm run ui-theme:lyra` を実行する |

## 変えるとき

テンプレートの値をそのまま写す。サイト固有の色は `apps/web/src/app/globals.css` に置き、ここへ足さない。
`tokens.css` を変えたら `node packages/ui-theme/build-hsl-tokens.mjs` を実行する
(`apps/web/src/__tests__/ui-theme-tokens.test.ts` が食い違いを止める)。
テンプレートを追従させるときは、上の CSS と部品の写しを同じコミットに揃える。

## lyra の書き込み方 (2026-10-28 CSS-3)

CSS で読んでいた間、lyra の規則はレイヤーの外にあり、部品の素のクラスにも呼び出し側の className にも勝っていた
(勝てるのは `!` 付きだけ。テンプレートも呼び出し側で `!` を付ける)。className に書き込んだ後も同じ勝ち方を保つ。

- `cn(…)` の引数に `cn-*` を含む文字列があれば、その規則の `@apply` を最後の引数 `/* lyra */ "…"` として足す。className より後ろなので tailwind-merge が lyra の値を残す
- `cva(…)` の文字列に `cn-*` があれば、同じ variant の形で lyra だけの cva (`<名前>Lyra`) を `// lyra:begin` 〜 `// lyra:end` に書く。`button`・`badge`・`toggle` は `<名前>Variants` を「素のクラス → className → lyra」の順に合成する包みにした。`ToggleGroupItem` は Toggle の素のクラス → className → Toggle の lyra → 自分の lyra の順
- 呼び出し側の className が入らない `className="…"` の直書きは、その文字列の中で lyra を後ろに合成する
- lyra に負けていた素のクラスは文字列から外す。`hover:` などの variant 付きは tailwind-merge では消えず、残すと効き始めるため (例: lyra の `bg-transparent` は `hover:bg-muted` にも勝っていた)。呼び出し側の variant 付きの同種のクラス (3 件) と、子の部品の lyra に負けていた `[&_td]:py-0 [&_th]:h-8` (1 か所) も外した。それ以外の負けていた呼び出し側の指定は見た目を変えないため残してある (backlog `LYRA-DEAD-CALLER-CLASSES-01`)

確かめ方: 11 ページ × 3 幅 (+ ダーク) の撮り比べと全要素の計算後スタイル、サイトマップから選んだ約 300 URL の全要素について
「変更前の勝ち方で合成したクラス」と「変更後のクラス」の一致 (約 30 万要素で lyra 由来の差 0)、同じ URL で lyra の目印を持つ要素の計算後スタイル (56,546 要素で差 0。残りは読み込みの揺らぎ) を見た (2026-10-28)。テンプレートを取り直したら `npm run ui-theme:lyra` を実行し、同じ確かめ方をする。
