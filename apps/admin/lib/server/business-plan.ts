import "server-only";

import {
  BUSINESS_PLAN_2026,
  type BusinessPlanDecisionStatus,
  type BusinessPlanMeasurementStatus,
  type BusinessPlanWorkStatus,
} from "@stats47/data-configs/business-plan";

import {
  frontmatterValue,
  readJson,
  readText,
  wrap,
  type Wrapped,
} from "./state-io";

interface BusinessPlanState {
  schemaVersion: number;
  generatedAt: string;
  catalogId: string;
  catalogVersion: string;
  sourceSha256: string;
  coverage: Record<string, number>;
  statusCounts: Record<BusinessPlanDecisionStatus, number>;
  eventCounts: Partial<Record<BusinessPlanMeasurementStatus, number>>;
  sourceFreshness: Record<string, string | null>;
  nextActions: Array<{
    id: string;
    title: string;
    owner: string;
    gate: string;
  }>;
  measurementWarning: string;
}

export interface BusinessPlanDocumentView {
  id: string;
  title: string;
  path: string;
  role: string;
  owner: string;
  updated: string | null;
  status: string | null;
}

export interface BusinessPlanDocumentDetail extends BusinessPlanDocumentView {
  body: string;
}

export interface BusinessPlanAdminData {
  catalog: typeof BUSINESS_PLAN_2026;
  state: Wrapped<BusinessPlanState>;
  documents: Wrapped<BusinessPlanDocumentView[]>;
  counts: {
    readyContent: number;
    gatedInitiatives: number;
    unmeasuredEvents: number;
  };
}

export function businessPlanAdminData(): BusinessPlanAdminData {
  const documents = wrap(() =>
    BUSINESS_PLAN_2026.documents.map((document) => {
      const text = readText(document.path);
      return {
        ...document,
        updated: frontmatterValue(text, "updated"),
        status: frontmatterValue(text, "status"),
      };
    })
  );
  const state = wrap(() =>
    readJson<BusinessPlanState>(".claude/state/business-plan/latest.json")
  );

  return {
    catalog: BUSINESS_PLAN_2026,
    state,
    documents,
    counts: {
      readyContent: BUSINESS_PLAN_2026.contentOpportunities.filter(
        (item) => item.status === "ready"
      ).length,
      gatedInitiatives: BUSINESS_PLAN_2026.initiatives.filter(
        (item) => item.status === "gated"
      ).length,
      unmeasuredEvents: BUSINESS_PLAN_2026.events.filter(
        (item) => item.status === "not-instrumented"
      ).length,
    },
  };
}

export function businessPlanDocument(
  id: string
): BusinessPlanDocumentDetail | null {
  const document = BUSINESS_PLAN_2026.documents.find((item) => item.id === id);
  if (!document) return null;
  const body = readText(document.path);
  return {
    ...document,
    updated: frontmatterValue(body, "updated"),
    status: frontmatterValue(body, "status"),
    body: body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim(),
  };
}

export const businessPlanLabels = {
  decision: {
    adopted: "採用",
    adapted: "適合変更",
    deferred: "保留",
    rejected: "不採用",
  } satisfies Record<BusinessPlanDecisionStatus, string>,
  work: {
    ready: "実行可能",
    "in-progress": "進行中",
    blocked: "停止",
    gated: "開始条件待ち",
    candidate: "候補",
  } satisfies Record<BusinessPlanWorkStatus, string>,
  measurement: {
    measured: "計測済み",
    "partially-measured": "部分計測",
    "not-instrumented": "未実装",
    manual: "手動記録",
  } satisfies Record<BusinessPlanMeasurementStatus, string>,
};
