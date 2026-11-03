"use client";

import { HubSankeyFlow, type HubSankeyFlowLabels } from "@/components/charts/HubSankeyFlow";

import type { MigrationFlowData } from "@stats47/migration-flow";

/** 焦点県 人口移動フロー Sankey: 左=流入元 / 中央=焦点県 / 右=流出先。幅=年間移動者数。 */
const LABELS: HubSankeyFlowLabels = {
  flowName: "人口移動フロー",
  inflow: "流入元",
  outflow: "流出先",
  width: "人数",
  centerNet: "純移動",
  totalIn: "総流入",
  totalOut: "総流出",
  totalNet: "純",
};

export function MigrationSankey({ code, initialData }: { code: string; initialData?: MigrationFlowData }) {
  return <HubSankeyFlow endpoint="migration" code={code} initialData={initialData} labels={LABELS} />;
}
