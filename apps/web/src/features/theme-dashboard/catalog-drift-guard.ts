/**
 * componentType drift ガード (type-check 時のみ・runtime 実体なし)。
 *
 * テーマページのチャート型 SSOT `ThemeDbChartComponentProps`
 * (`./actions/theme-chart-props.ts`) の componentType が、packages 側の
 * `CatalogComponentType` (`@stats47/data-configs`、ThemeCatalog が使う複製 union) に
 * **すべて含まれる**ことを型レベルで保証する。テーマ renderer にチャート型を追加したのに
 * カタログ union へ足し忘れると `tsc --noEmit` が失敗する。
 *
 * 注: 非チャート型 (kpi-card / markdown-section / pyramid-chart) は
 * ThemeDbChartComponentProps に含まれず ThemeMetricsDashboard 側で個別描画されるため、
 * このガードの対象外 (安定した固定集合として CATALOG_COMPONENT_TYPES に手で載せる)。
 */
import type { CatalogComponentType } from "@stats47/data-configs";

import type { ThemeDbChartComponentProps } from "./actions/theme-chart-props";

type ThemeChartType = ThemeDbChartComponentProps["componentType"];

// ThemeChartType (renderer のチャート型) ⊆ CatalogComponentType (カタログ union)。
type Expect<T extends true> = T;
export type _ThemeChartTypeDriftGuard = Expect<
  ThemeChartType extends CatalogComponentType ? true : false
>;
