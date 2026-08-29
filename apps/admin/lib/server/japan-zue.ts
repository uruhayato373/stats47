import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  JAPAN_ZUE_MASTER_CONTENT,
  JAPAN_ZUE_PILOT_ITEMS,
} from "@stats47/data-configs/evidence-inventory";

import { projectRoot } from "./project-root";

export interface JapanZueInventorySummary {
  sourceKey: string;
  edition: string;
  candidatesSha256: string;
  counts: { table: number; figure: number; "text-stat": number; total: number };
  resolutionCounts: Record<string, number>;
  resolutionCoverage: number;
  primarySourceCoverage: number;
  productionReadyCount: number;
  publicCandidateCount: number;
  pilotReadyCount: number;
  manualOverrideCount: number;
  blockers: { primarySourceUnavailable: number; rightsHold: number; unreviewed: number };
}

export type JapanZueResearchData =
  | {
      summary: JapanZueInventorySummary;
      pilot: typeof JAPAN_ZUE_PILOT_ITEMS;
      masterContent: typeof JAPAN_ZUE_MASTER_CONTENT;
      source: string;
    }
  | { error: string; source: string };

export function japanZueResearchData(root = projectRoot()): JapanZueResearchData {
  const relative = ".claude/state/source-inventory/japan-zue/2025-26/evidence-summary.json";
  const source = path.join(root, relative);
  try {
    const summary = JSON.parse(fs.readFileSync(source, "utf8")) as JapanZueInventorySummary;
    if (summary.sourceKey !== "japan-zue" || summary.edition !== "2025-26") {
      throw new Error("sourceKey/editionが期待値と一致しません");
    }
    return {
      summary,
      pilot: JAPAN_ZUE_PILOT_ITEMS,
      masterContent: JAPAN_ZUE_MASTER_CONTENT,
      source: relative,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), source: relative };
  }
}
