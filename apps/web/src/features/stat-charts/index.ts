// CityListSidebar は server component → server.ts へ移動
// DashboardGridLayout は server component（DashboardComponentRenderer に依存）→ server.ts へ移動
export * from './components/layouts/DashboardPageHeader';
export * from './components/ui/ScrollToTopButton';
export * from "./types";
// utils: client-safe のみ export（computeYAxisDomain は server.ts 経由）
export { extractDashboardProps } from "./utils/extractDashboardProps";
export * from "./utils/generate-dashboard-metadata";

// Client-safe component exports
export { DashboardCard } from "./components/shared/DashboardCard";
export { ChartSkeleton } from "./components/shared/ChartSkeleton";
export { LineChartClient } from "./components/charts/LineChart/LineChartClient";

// Client-safe adapter exports
export { toLineChartData } from "./adapters/toLineChartData";

// Client-safe card components
export { KpiCardClient } from "./components/cards/KpiCard/KpiCardClient";

// Re-export PageComponent type (type-only, safe for client components)
export type { PageComponent } from "./services/load-page-components";

