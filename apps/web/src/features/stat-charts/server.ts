import "server-only";

// Server-only services
export { fetchEstatData, fetchEstatDataWithCategories } from "./services/fetchEstatData";

// Server-only utils
export { computeSharedYDomain } from "./utils/computeSharedYDomain";

// Server-only adapters
export { toKpiCardData } from "./adapters/toKpiCardData";

// Server-only components
export { DashboardComponentRenderer } from "./components/DashboardComponentRenderer";

// Server-only services (page_components)
export { loadPageComponents, type PageComponent } from "./services/load-page-components";
