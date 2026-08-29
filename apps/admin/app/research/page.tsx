import type { Metadata } from "next";

import { DashboardCatalogView } from "@/components/research/dashboard-catalog-view";
import { JapanZueInventoryPanel } from "@/components/research/japan-zue-inventory-panel";
import { japanZueResearchData } from "@/lib/server/japan-zue";

export const metadata: Metadata = {
  title: "調査カタログ — stats47 管理コンソール",
};

export default function ResearchPage() {
  return (
    <div className="space-y-8">
      <JapanZueInventoryPanel data={japanZueResearchData()} />
      <DashboardCatalogView />
    </div>
  );
}
