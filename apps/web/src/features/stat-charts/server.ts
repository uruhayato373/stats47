import "server-only";

// Server-only services
export { fetchEstatData, fetchEstatDataWithCategories } from "./services/fetchEstatData";

// Server-only utils
export { computeSharedYDomain } from "./utils/computeSharedYDomain";

// Server-only adapters
export { toKpiCardData } from "./adapters/toKpiCardData";

// Server-only components
export { DashboardComponentRenderer } from "./components/DashboardComponentRenderer";

// Server-only utils (used by server components for DB → DashboardComponent conversion)
export { toDashboardComponent } from "./utils/toDashboardComponent";
