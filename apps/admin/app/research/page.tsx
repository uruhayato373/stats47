import type { Metadata } from "next";

import { DashboardCatalogView } from "@/components/research/dashboard-catalog-view";

export const metadata: Metadata = {
  title: "調査カタログ — stats47 管理コンソール",
};

export default function ResearchPage() {
  return <DashboardCatalogView />;
}
