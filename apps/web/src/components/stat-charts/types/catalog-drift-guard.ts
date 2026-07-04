/**
 * componentType drift ガード (type-check 時のみ・runtime 実体なし)。
 *
 * app 層の `DashboardConfigMap` (SSOT) と packages 側の `CatalogComponentType`
 * (ThemeCatalog が使う複製 union) が一致しているかを型レベルで保証する。
 * どちらかに componentType を足し忘れ/消し忘れると `tsc --noEmit` が失敗する。
 *
 * 正典: apps/web/src/components/stat-charts/types/index.ts の DashboardConfigMap
 * 複製先: packages/data-configs/src/theme-catalog/types.ts の CATALOG_COMPONENT_TYPES
 */
import type { CatalogComponentType } from "@stats47/data-configs";

import type { DashboardComponentType } from "./index";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

// 両方向の型等価。componentType の drift でコンパイルエラーになる。
export type _ComponentTypeDriftGuard = Expect<
  Equal<DashboardComponentType, CatalogComponentType>
>;
