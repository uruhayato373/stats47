# @stats47/ui-theme

テンプレート [shadcndashboard/next-shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)
(MIT・commit `91deb102`) の見た目を、公開サイト (`apps/web`) と管理画面 (`apps/admin`) で共有する CSS。
2026-10-27 のオーナー決定「テンプレートを正としてサイトを寄せる」による。

| ファイル | 中身 | 出どころ |
|---|---|---|
| `index.css` | 入口。下の 4 つを順に読む | — |
| `tokens.css` | 色・角丸のトークン (`:root` / `.dark`) と Tailwind の `@theme inline` | テンプレート `app/globals.css` |
| `shadcn-tailwind.css` | `data-open:` などの追加の書き方とアコーディオンの動き | npm `shadcn@4` の `dist/tailwind.css` (MIT) |
| `style-lyra.css` | Base UI 部品の `cn-*` クラスの見た目 | テンプレート `app/css/styles/style-lyra.css` |

## 使い方

```css
@import "tailwindcss";
@import "@stats47/ui-theme";
```

ルート要素 (`<html>`) に `class="style-lyra"` を付ける。部品 (`components/ui/*.tsx`) はテンプレートと同じ
Base UI 版を使い、比較元は `.claude/config/shadcn-reference/` (取り直しは
`node .claude/scripts/admin-ui/sync-shadcn-reference.mjs`)。

## 変えるとき

テンプレートの値をそのまま写す。アプリ固有の色は各アプリの `globals.css` に置き、ここへ足さない。
テンプレートを追従させるときは、上の 3 ファイルと `sync-shadcn-reference.mjs` の `TEMPLATE_SHA` を同じコミットに揃える。
