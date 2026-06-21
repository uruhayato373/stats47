export * from "./types";
export * from "./utils/generate-dashboard-metadata";

// Client-safe component exports
export { LegacyDashboardCard } from "./components/shared/DashboardCard";
export { DashboardCard } from "./components/shared/DashboardCard";
export { ChartSkeleton } from "./components/shared/ChartSkeleton";
export { LineChartClient } from "./components/charts/LineChart/LineChartClient";

// Client-safe adapter exports
export { toLineChartData } from "./adapters/toLineChartData";

// Re-export PageComponent type (type-only, safe for client components)
export type { PageComponent } from "./services/load-page-components";
