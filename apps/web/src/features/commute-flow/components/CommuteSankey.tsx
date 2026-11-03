"use client";

import { HubSankeyFlow, type HubSankeyFlowLabels } from "@/components/charts/HubSankeyFlow";

import type { CommuteFlowData } from "../lib/types";

/** 焦点県 通勤フロー Sankey: 左=流入(他県常住→焦点勤務) / 中央=焦点県 / 右=流出(焦点常住→他県勤務)。幅=通勤者数。 */
const LABELS: HubSankeyFlowLabels = {
  flowName: "通勤フロー",
  inflow: "流入（他県に住み通勤）",
  outflow: "流出（他県へ通勤）",
  width: "通勤者数",
  centerNet: "昼間流入",
  totalIn: "流入",
  totalOut: "流出",
  totalNet: "昼間純流入",
};

export function CommuteSankey({ code, initialData }: { code: string; initialData?: CommuteFlowData }) {
  return <HubSankeyFlow endpoint="commute" code={code} initialData={initialData} labels={LABELS} />;
}
