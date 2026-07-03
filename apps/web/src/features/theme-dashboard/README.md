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

- `docs/01_技術設計/12_完全DBレス設計.md`
- `docs/01_技術設計/07_情報設計.md`
- `.claude/rules/r2-storage-design.md`
- `.claude/rules/data-storage.md`

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

Implementation backlog lives in `docs/02_実装計画/04_機能バックログ.md`. Keep this README for architecture and local feature conventions only.
