# @stats47/ui-theme

テンプレート [shadcndashboard/next-shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)
(MIT・commit `91deb102`) の見た目を、公開サイト (`apps/web`) に持ち込む CSS。
2026-10-27 のオーナー決定「テンプレートを正としてサイトを寄せる」による。
管理画面 (`apps/admin`) は shadcn 公式の base-nova を別に使う (`.claude/rules/admin-ui.md`)。このパッケージは読まない。

| ファイル | 中身 | 出どころ |
|---|---|---|
| `base.css` | 入口。下の 2 つと tw-animate を読み、`style-lyra` の variant を定義する | — |
| `shadcn-tailwind.css` | `data-open:` などの追加の書き方とアコーディオンの動き | npm `shadcn@4` の `dist/tailwind.css` (MIT) |
| `style-lyra.css` | Base UI 部品の `cn-*` クラスの見た目 | テンプレート `app/css/styles/style-lyra.css` |
| `tokens.css` | 色・角丸のトークン (テンプレートの oklch の値そのまま) | テンプレート `app/globals.css` |
| `tokens-hsl.css` | `tokens.css` と同じ色の HSL 3 値 (生成物・手で直さない) | `build-hsl-tokens.mjs` |

## 使い方

```css
@import "tailwindcss";
@import "@stats47/ui-theme/base.css";
@import "@stats47/ui-theme/tokens-hsl.css";
```

サイトは色を `hsl(var(--x))` の形で参照するので、oklch のままの `tokens.css` ではなく `tokens-hsl.css` を読む。
ルート要素 (`<html>`) に `class="style-lyra"` を付ける。部品 (`packages/components/src/atoms/ui/*.tsx`) は
テンプレートの同じコミットの `components/ui/` の写しで、変えたのは import 先と、各ファイル先頭に書いたサイト固有の追加だけ。

## 変えるとき

テンプレートの値をそのまま写す。サイト固有の色は `apps/web/src/app/globals.css` に置き、ここへ足さない。
`tokens.css` を変えたら `node packages/ui-theme/build-hsl-tokens.mjs` を実行する
(`apps/web/src/__tests__/ui-theme-tokens.test.ts` が食い違いを止める)。
テンプレートを追従させるときは、上の CSS と部品の写しを同じコミットに揃える。
