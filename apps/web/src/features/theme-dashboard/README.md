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
would otherwise read the default (no-op) context. Below the shared 992px boundary the rail is hidden — a nav that switches
the page content is useless when stacked after the content it controls. The content column therefore
owns equivalent controls directly below the breadcrumb: `ThemeSwitcher`, `PrefectureSelect`, page anchors,
all metric links, and source surveys. The desktop rail has the same roles and does not expand the full theme list.

`app/themes/local-finance` keeps its bespoke finance renderer, but uses the same Provider, 5-digit URL preference and Cookie. Its page composes `PageShell` directly; do not add a second shell.

## Geography Scope Contract

Theme Dashboard is a 47-prefecture comparison surface. Its geography never becomes a Japanese
national observation. The initial display preference is resolved in this order:
`/areas` context → URL `?pref=` → `preferred-prefecture` Cookie → first-visit default `兵庫県 (28000)`.
The explicit `prefecture-set` choice is stored as the `all` sentinel so a later visit does not reset it
to Hyogo. React context remains the runtime SSOT; a second client-state library is not introduced.

- First-visit UI selection: `兵庫県`. Explicit collection-view label: `47都道府県`.
- `PrefectureSelect` renders the resolved region label inside `SelectValue` in the initial server HTML. Do not rely on Radix's post-mount item-text portal to fill an empty trigger; SSR/hydration tests preserve the label and the same trigger DOM.
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

## Editorial Chapters

`ThemeCatalog.sections` owns the reading order: title, short description, metric-group keys, chart keys and embedded-section keys. `ThemePageLayout` passes server-rendered embedded slots through the client dashboard, preserving async maps without importing server components into the browser. Rail and narrow navigation use the same chapter anchors. Each group/chart/embedded slot renders once; unassigned blocks remain visible as a fallback during snapshot updates.

A group whose metrics are all covered by its chapter's selected-area charts renders values only; it does not fetch or repeat the same trend. Every value tile carries the observation year and raw unit. At most two distinct units may share the switcher's axes. A single-year result uses natural-height text or a dated comparison table; it never reserves an empty chart canvas. A multi-year companion keeps its history. Composition charts require common observed years and a common unit; missing segments do not become zero.

Regional scope and observed period appear next to each additional chart. Explicit national series are labeled in the legend even when a prefecture is selected. Arithmetic means describe the available prefectures rather than asserting that all 47 were observed.

Navigation uses existing `nav_click` dimensions: `theme_section` (`theme-key:anchor`), `theme_region` (5-digit code or `all`), `theme_switcher` (destination theme key), alongside `theme_kpi_switcher` and `theme_evidence`. The weekly GA4 collector writes Japan-only rolling-28-day `pages-clean.csv` and `theme-navigation.csv`, each with `.meta.json` recording its period, country filter and fetch status. Failed metadata must block use of an older CSV. Recurring review and tasks remain in the theme portfolio state/backlog, not in this README.

## Chart Editorial Contract

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

### 指標の横断比較

`ThemeComparisonSection` は既存の章・チャートの後に県別分布と指標横断表を置く。
比較対象は既存 `metricGroups` / `tabIndicators` から導出し、カタログへ別リストを追加しない。
同じ年次の県値から中央値と差分を求め、固定比較年も尊重する。`comparisonMap` のあるグループの
地図は重複させない。地図クリックは共有県選択へ接続し、市区町村にはドリルダウンしない。
暦年の古い「年度」ラベルは `themeYearLabel` が補正し、月・基準日・注記は保持する。
