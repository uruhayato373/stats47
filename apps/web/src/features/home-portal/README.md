# home-portal

`/` を、検索・カテゴリ・ランキング・ブログ・テーマ・都道府県へ接続する発見ハブとして
構成する feature。実装済みの現行契約だけを記載する。

## 正典

| 対象                 | 正典                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| ページ構造・表示件数 | `apps/web/src/app/page.tsx`                                           |
| 利用意図と表示順     | `packages/data-configs/src/home-portal.ts`                            |
| UI・レイアウト       | `docs/01_技術設計/04_デザインシステム.md`                             |
| 情報設計             | `docs/01_技術設計/03_情報設計.md`                                     |
| GA4イベント          | `.claude/rules/analytics-event-standards.md`                          |
| 注目ランキング       | `apps/web/src/features/ranking/components/FeaturedRankings/README.md` |

## 現行構造

- home本文の先頭は共通`PageHeader`。暗色hero、背景画像、本文内検索を置かない
- 検索は共通Headerへ集約する
- desktopは左に全17カテゴリ、右に注目ランキング6件、新着ブログ8件、
  利用意図6件、都道府県入口、運営者プロフィールを置く
- mobileはランキング・ブログ・利用意図を先に、カテゴリを後に表示する
- ランキング、ブログ、利用意図は共通`HorizontalCardCarousel`を使う
- カード比率は`PORTAL_CARD_ASPECT_CLASS`を使う
- `PORTAL_CARD_ASPECT_CLASS`は外枠の比率。ブログカードの画像枠は
  `.claude/rules/ogp-image-standards.md`の1200×630を使い、16:9へクロップしない
- 注目ランキングは決定的に生成した地理地図と1位情報の単一形式とする
- `FeaturedRankings`とブログsnapshotをR2から読むため、`/`は`force-dynamic`を維持する

## 設定

`HOME_PORTAL_USE_CASES`は「知りたいことから探す」の編集設定である。

- git TSがSSOT
- `themeKey`は`ALL_THEMES`に実在すること
- `id`、遷移先、`order`を重複させない
- `order`は1始まりの連番
- runtime LLM、JSON SSOT、D1を追加しない

カテゴリは17軸の正典から、ブログはsnapshotから直接導出する。home専用のカテゴリ複製や
人気検索語設定は持たない。

## 計測

既存`nav_click`の`nav_surface`で導線を区別する。

| 導線     | `nav_surface`   |
| -------- | --------------- |
| カテゴリ | `home_category` |
| 利用意図 | `home_use_case` |
| 都道府県 | `home_area`     |
| ブログ   | `home_blog`     |

検索はHeaderの`trackSearch`、注目ランキングは
`home_featured_impression` / `home_featured_click`を使う。

## 変更時の検証

- `config/__tests__/home-portal.test.ts`
- `components/__tests__/PortalSections.test.tsx`
- `__tests__/home-page-structure.test.ts`
- `npm run type-check --workspace apps/web`
- UI変更時は390px / 1280px、light / dark、keyboard、horizontal overflowを確認する
