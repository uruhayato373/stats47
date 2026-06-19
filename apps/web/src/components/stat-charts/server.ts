import "server-only";

// Server-only services
export { fetchEstatData } from "./services/fetchEstatData";

// Server-only utils
export { computeSharedYDomain } from "./utils/computeSharedYDomain";

// Server-only adapters
export { toKpiCardData } from "./adapters/toKpiCardData";

// Server-only components
export { DashboardComponentRenderer } from "./components/DashboardComponentRenderer";
export { DashboardGridLayout } from "./components/DashboardGridLayout";

// Server-only services (page_components)
// Phase 5b: loadPageComponents は R2 snapshot 経由。D1 版は load-page-components.ts に残置 (バッチ用)。
export { type PageComponent } from "./services/load-page-components";
export {
  readPageComponentsFromR2 as loadPageComponents,
  readCityCategoryKeysFromR2,
} from "./services/page-components-snapshot";

// Server-only services (R2 cache)
export { getEstatCacheStorage } from "./services/get-estat-cache-storage";
