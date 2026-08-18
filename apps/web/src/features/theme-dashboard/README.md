---
type: feature-readme
status: active
source: legacy implementation plan removed on 2026-06-29
---

# Theme Dashboard

`/themes/[themeKey]` ダッシュボードの実装メモ。実装計画から恒久的な feature 設計だけを移したもの。

## Data Architecture

完全 DB レス構成を正典にする。

| Layer | SSOT | Delivery | Consumer |
|---|---|---|---|
| Theme list / metadata | `apps/web/src/features/theme-dashboard/config/all-themes.ts` | build-time import | `generateStaticParams` / `loadThemeData` |
| Indicator sets | `packages/types/src/indicator-sets/*.ts` | build-time import | `to-theme-config.ts` |
| Chart composition | `apps/web/scripts/data/page-components/theme/<key>.json` | R2 `app/page-components/theme/<key>.json` | `ThemeDbChartRenderer` |
| Metric values | R2 `app/ranking/<key>/values.json` | R2 partitions | `loadThemeData` / `ThemeMetricsDashboard` |

Related canon:

- `docs/01_技術設計/02_データアーキテクチャ.md`
- `docs/01_技術設計/03_情報設計.md`
- `.claude/rules/r2-storage-design.md`
- `.claude/rules/data-storage.md`

## Page Shell / Navigation

`ThemePageLayout` owns the shell. Page components (`app/themes/[themeSlug]`, `app/areas/[areaCode]/[themeSlug]`,
`app/themes/local-finance/cities`) render it directly and must **not** wrap it in another `PageShell`.

```
ThemePrefectureProvider          ← prefecture state (URL ?pref= sync)
  └─ PageShell leftRail={ThemeSideNav} leftRailNarrowBehavior="hide"
       └─ breadcrumb / toolbar / lg:hidden ThemeSwitcher / ThemeAreaHeader / dashboard
```

The provider must stay outside `PageShell` because `ThemeSideNav` holds the prefecture select and
would otherwise read the default (no-op) context. Below `xl` the rail is hidden — a nav that switches
the page content is useless when stacked after the content it controls — and the narrow-width
equivalents are the `lg:hidden` `ThemeSwitcher` band and the `lg:hidden` `PrefectureSelect` in the
header `actions`.

`app/themes/local-finance` is bespoke (it has no provider) and passes `showRegion={false}`.

## Chart Type Decision

| Need | Preferred chart |
|---|---|
| 47-prefecture current comparison | choropleth / ranking bar |
| Time trend by prefecture | line chart |
| Composition / breakdown | pie or stacked bar only when categories are semantically stable |
| Cross-metric relation | scatter plot |
| Heavy national structure | theme page, not area page |

## R2 Reflection Flow

```bash
npm run export:page-components --workspace apps/web
```

Production reflection should go through CI / snapshot workflows. Local R2 writes are not the default path. After reflection, ISR / R2 reader cache may delay rendering updates; purge CDN only when an outward-facing confirmation requires it.

## Backlog

Implementation backlog lives in `.claude/todo/backlog.md`. Keep this README for architecture and local feature conventions only.
