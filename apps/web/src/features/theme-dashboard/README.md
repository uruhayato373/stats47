---
type: feature-readme
status: active
source: legacy implementation plan removed on 2026-06-29
---

# Theme Dashboard

`/themes/[themeKey]` ダッシュボードの実装メモ。実装計画から恒久的な feature 設計だけを移したもの。

## Data Architecture

完全 DB レス構成を正典にする。

| Layer                 | SSOT                                                         | Delivery                                                   | Consumer                                  |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| Theme list / metadata | `apps/web/src/features/theme-dashboard/config/all-themes.ts` | build-time import                                          | `generateStaticParams` / `loadThemeData`  |
| Indicator sets        | `packages/types/src/indicator-sets/*.ts`                     | build-time import                                          | `to-theme-config.ts`                      |
| Chart composition     | `packages/data-configs/src/theme-catalog/<key>.ts`           | generated JSON → R2 `app/page-components/theme/<key>.json` | `ThemeDbChartRenderer`                    |
| Metric values         | R2 `app/ranking/<key>/values.json`                           | R2 partitions                                              | `loadThemeData` / `ThemeMetricsDashboard` |

Related canon:

- `docs/01_技術設計/02_データアーキテクチャ.md`
- `docs/01_技術設計/03_情報設計.md`
- `.claude/rules/r2-storage-design.md`
- `.claude/rules/data-storage.md`

## Page Shell / Navigation

`ThemePageLayout` owns the shell. Page components (`app/themes/[themeSlug]`, `app/areas/[areaCode]/[themeSlug]`,
`app/themes/local-finance/page.tsx`) render it directly and must **not** wrap it in another `PageShell`.

```
ThemePrefectureProvider          ← prefecture state (URL + Cookie sync)
  └─ PageShell leftRail={ThemeSideNav} leftRailNarrowBehavior="hide"
       └─ geography scope / compact controls / ThemeAreaHeader / dashboard
```

The provider must stay outside `PageShell` because `ThemeSideNav` holds the prefecture select and
would otherwise read the default (no-op) context. Below `lg` the rail is hidden — a nav that switches
the page content is useless when stacked after the content it controls. The content column therefore
owns equivalent controls directly below the breadcrumb: `ThemeSwitcher`, `PrefectureSelect`, page anchors,
all metric links, and source surveys. The desktop rail has the same roles and does not expand the full theme list.

`app/themes/local-finance` uses the same provider; its detailed settlement cards follow the shared prefecture selection.

## Geography Scope Contract

Theme Dashboard is a 47-prefecture comparison surface. Its geography never becomes a Japanese
national observation. The initial display preference is resolved in this order:
`/areas` context → URL `?pref=` → `preferred-prefecture` Cookie → first-visit default `兵庫県 (28000)`.
The explicit `prefecture-set` choice is stored as the `all` sentinel so a later visit does not reset it
to Hyogo. React context remains the runtime SSOT; a second client-state library is not introduced.

- First-visit UI selection: `兵庫県`. Explicit collection-view label: `47都道府県`.
- A selected prefecture uses `?pref=<5桁都道府県コード>` and exposes that prefecture's value, rank, and trend.
- Theme-switch links carry the current `pref` value as well as the Cookie to prevent stale prefetched state.
- `00000` is an e-Stat national area code. It must not also represent the theme UI's no-selection state.
- The arithmetic mean of 47 prefectures is never a Japanese national value. After a prefecture is selected,
  it may be shown only as an explicitly labeled `都道府県平均` comparison baseline.
- In explicit `prefecture-set` view, a chart that requires a prefecture shows a compact selection prompt.
  Missing data is not converted to zero and is not silently replaced with a representative prefecture.
- True national observations belong to `/japan/*` and a separate reader/data contract. World comparisons
  belong to `/world/*`; they are not added to the prefecture context.

The migration is specified in
`docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md`.

## Chart Type Decision

| Need                             | Preferred chart                                                 |
| -------------------------------- | --------------------------------------------------------------- |
| 47-prefecture current comparison | choropleth / ranking bar                                        |
| Time trend by prefecture         | line chart                                                      |
| Composition / breakdown          | pie or stacked bar only when categories are semantically stable |
| Cross-metric relation            | scatter plot                                                    |
| Heavy national structure         | theme page, not area page                                       |

## Chart Editorial Contract

全テーマの `ThemeCatalog.overview` に従い、主要指標（最大4件）→ 指標切替付きの
県別地図・一覧 → 複数指標の比較表 → curated chart の順に表示する。`headlineRankingKeys` /
`comparisonRankingKeys` / `mapNotes` はカタログが所有する。気候もカタログから生成し、
地方財政の決算カード・市区町村の内訳は共通UIの詳細欄に置いて県選択を同期する。
指標の選定根拠・調査日は同じカタログの `selection` に置く。

- 概況は見出しに県選択を置き、主要指標・地図と順位表・比較表・推移の順でコンパクトに表示する。左ナビの寸法は `PageShell.leftRailDensity="compact"` 経由で共有 `LeftRailLayout` が所有する。
- カード全体から指標の地図へ移動できる。解説と白書の論点は共有 `ContentDisclosure` で開閉し、調査年・単位・中央値の定義・指標固有の注意は常時表示する。
- 地図の境界はクライアントで `/prefecture.topojson` を取得し、RSC payload に含めない。
- 県選択は既存 `ThemePrefectureContext` と URL を共有する。概況の地図では市区町村へドリルダウンしない。
- 比較表は同年・有限値の都道府県だけを対象に中央値と差を計算し、年次・県数を併記する。
  中央値は日本全体の集計値と区別し、割合の差はポイントで示す。欠測はゼロに置換しない。
- 単年しかない指標は表で確認する。空き家率と持ち家率は分母が違うため別の推移図とする。
- 折れ線の採否は設定上の年範囲だけで判断せず、R2の実収録年を確認する。単位・対象が異なる系列の合計、内数を含む円グラフ、旧系列の接続を避ける。全指標へのリンクは残す。
- 回帰検証: `theme-overview.test.ts`、`theme-overview-coverage.test.ts`、`living-housing-evidence-topics.test.ts`。`validate:catalog` は公開テーマの概況未定義も検知する。

Theme chart は複数指標の関係を読むための可視化であり、指標定義の保存場所ではない。

- header は短い title のみ。component type から「線の傾きを確認できます」等を自動生成しない。
- legend、axis、unit、year は chart 本体に置く。
- 系列断絶、母集団差、比較不能条件など、その chart 固有の注意だけを `ThemeCatalog.charts[].annotation` に置き、footer に表示する。
- 指標の定義、算出方法、一般注釈、出典詳細、関連ページは `/ranking/[key]` を指標ハブとして集約する。
- chart は `relatedRankingKeys` で指標ハブへ接続する。title 類似だけで mapping を推測しない。
- footer は primary hub と補助2件までを表示する。全関連指標は左レール／狭幅の「全指標」で探索する。
- `ChartPanel` は title を accessible name にした `section` とし、説明文を外しても領域名を失わない。

契約は `validate:catalog`、transform tests、Theme UI contract tests が固定する。

## R2 Reflection Flow

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run export:page-components --workspace apps/web
```

Production reflection should go through CI / snapshot workflows. Local R2 writes are not the default path. After reflection, ISR / R2 reader cache may delay rendering updates; purge CDN only when an outward-facing confirmation requires it.

`npm run dev` では R2 開発ゲートウェイが、この git SSOT 配下の `app/page-components/*`
だけをローカル優先で配信する。画像と観測値は従来どおり R2 から読むため、カタログ生成後は
R2 push や本番デプロイなしでチャート構成を確認できる。

## Backlog

Implementation backlog lives in `.claude/todo/backlog.md`. Keep this README for architecture and local feature conventions only.
