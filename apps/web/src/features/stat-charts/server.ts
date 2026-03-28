import "server-only";

// Server-only services
export { fetchEstatData, fetchEstatDataWithCategories } from "./services/fetchEstatData";

// Server-only utils
export { computeSharedYDomain } from "./utils/computeSharedYDomain";
export { computeYAxisDomain } from "./utils/computeYAxisDomain";

// Server-only adapters
export { toKpiCardData } from "./adapters/toKpiCardData";

// Server-only components
export { DashboardComponentRenderer } from "./components/DashboardComponentRenderer";
export { DashboardGridLayout } from "./components/DashboardGridLayout";
export { CityListSidebar } from "./components/CityListSidebar";

// Server-only services (page_components)
export { loadPageComponents, type PageComponent } from "./services/load-page-components";

// Server-only services (R2 cache)
export { getEstatCacheStorage } from "./services/get-estat-cache-storage";
