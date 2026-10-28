import type { Metadata } from "next";

import { PageHeading } from "@/components/ops/primitives";
import { DashboardCatalogView } from "@/components/research/dashboard-catalog-view";
import { JapanZueInventoryPanel } from "@/components/research/japan-zue-inventory-panel";
import { japanZueResearchData } from "@/lib/server/japan-zue";
import { datasetDir } from "../../../../config/datasets.mjs";

export const metadata: Metadata = {
  title: "調査カタログ — stats47 管理コンソール",
};

/** 調査カタログ。型 B (一覧): 件数の要約 → 一覧 (日本国勢図会の evidence inventory と公式ダッシュボード研究カタログ) */
export default function ResearchPage() {
  return (
    <>
      <PageHeading
        title="調査カタログ"
        source={`${datasetDir("source-inventory.manifests")}/japan-zue/2025-26/evidence-summary.json + .claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json`}
      />
      <JapanZueInventoryPanel data={japanZueResearchData()} />
      <DashboardCatalogView />
    </>
  );
}
