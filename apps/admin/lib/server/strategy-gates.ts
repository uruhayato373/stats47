import "server-only";

import { buildGateBoard, type GateBoard, type GateInputs, gateRowsFromTable } from "../strategy-gates";
import { adsSummary } from "./ads";
import { revenueSummary } from "./revenue";
import { hasError, mdTableAfter, readText } from "./state-io";

/**
 * 収益化戦略 §5 のゲート表と、各行の判定元の state を読む。**読み取り専用**。
 * 判定は持たない: 表は文書を解析し、状態は /affiliate と /revenue が出しているのと同じ read model から引く
 * (同じ state を別の読み方で二重に読まない)。対応づけは lib/strategy-gates.ts。
 */

export const GATE_TABLE_DOC = "docs/00_プロジェクト管理/02_収益化戦略.md";
const GATE_SECTION = /^## 5\. /;

export interface StrategyGateBoard extends GateBoard {
  source: string;
  error: string | null;
}

function readInputs(): GateInputs {
  const ads = adsSummary();
  const revenue = revenueSummary();
  const adsense = revenue.coverage.find((c) => c.channel === "AdSense");
  return {
    measurementGate: hasError(ads.operations)
      ? null
      : { ...ads.operations.measurementGate, generatedAt: ads.operations.generatedAt ?? null },
    pilotReadiness:
      hasError(ads.pilot) || !ads.pilot.readiness
        ? null
        : { ...ads.pilot.readiness, generatedAt: ads.pilot.generatedAt ?? null },
    adsenseCoverage: adsense ? { state: adsense.state, note: adsense.note } : null,
  };
}

export function strategyGateBoard(): StrategyGateBoard {
  try {
    const rows = gateRowsFromTable(mdTableAfter(readText(GATE_TABLE_DOC), GATE_SECTION));
    return { source: GATE_TABLE_DOC, ...buildGateBoard(rows, readInputs()), error: null };
  } catch (e) {
    return { source: GATE_TABLE_DOC, rows: [], issues: [], error: e instanceof Error ? e.message : String(e) };
  }
}
