# @stats47/ui-theme

テンプレート [shadcndashboard/next-shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)
(MIT・commit `91deb102`) の見た目を、公開サイト (`apps/web`) に持ち込む CSS。
2026-10-27 のオーナー決定「テンプレートを正としてサイトを寄せる」による。
管理画面 (`apps/admin`) は shadcn 公式の base-nova を別に使う (`.claude/rules/admin-ui.md`)。このパッケージは読まない。

| ファイル | 中身 | 出どころ |
|---|---|---|
| `base.css` | 入口。下の 2 つと tw-animate を読み、`style-lyra` の variant を定義する | — |
| `shadcn-tailwind.css` | `data-open:` などの追加の書き方とアコーディオンの動き | npm `shadcn@4` の `dist/tailwind.css` (MIT) |
| `style-lyra.css` | Base UI 部品の `cn-*` クラスの見た目 (正本・手で直さない) | テンプレート `app/css/styles/style-lyra.css` |
| `style-lyra.used.css` | `style-lyra.css` のうちサイトのソースに出る `cn-*` の規則だけ (base.css が読む。生成物・手で直さない) | `npm run ui-theme:lyra` (`scripts/ui-theme/build-used-lyra.mjs`)。`npm run ui-theme:lyra:test` が取りこぼし・組み立て・再生成忘れを検査し、`.husky/pre-commit` と PR CI の static-gates で走る |
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

## 変えるとき

テンプレートの値をそのまま写す。サイト固有の色は `apps/web/src/app/globals.css` に置き、ここへ足さない。
`tokens.css` を変えたら `node packages/ui-theme/build-hsl-tokens.mjs` を実行する
(`apps/web/src/__tests__/ui-theme-tokens.test.ts` が食い違いを止める)。
テンプレートを追従させるときは、上の CSS と部品の写しを同じコミットに揃える。
