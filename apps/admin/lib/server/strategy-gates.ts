import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import { adminStatPilotProgress } from "../admin-stat-pilot";
import { buildGateBoard, type GateBoard, type GateInputs, gateRowsFromTable } from "../strategy-gates";
import { adsSummary } from "./ads";
import { revenueSummary } from "./revenue";
import { hasError, mdTableAfter, readJson, readText, wrap } from "./state-io";

/**
 * 収益化戦略 §5 のゲート表と、各行の判定元の state を読む。**読み取り専用**。
 * 判定は持たない: 表は文書を解析し、状態は /affiliate と /revenue が出しているのと同じ read model から引く
 * (同じ state を別の読み方で二重に読まない)。対応づけは lib/strategy-gates.ts。
 * 行政向け商品の検証の進み具合は、同じ §5 の「行政向け商品の検証順序」の表 (段階名) と聞き取り台帳から導く
 * (lib/admin-stat-pilot.ts)。段階を別の state へ書き写さない。
 */

export const GATE_TABLE_DOC = "docs/00_プロジェクト管理/02_収益化戦略.md";
const GATE_SECTION = /^## 5\. /;
const PILOT_STAGE_SECTION = /^### 行政向け商品の検証順序/;
export const ADMIN_STAT_INTERVIEWS_PATH = datasetPath("products.interviews");

export interface StrategyGateBoard extends GateBoard {
  source: string;
  /** §5「行政向け商品の検証順序」の表の段階名 (上から順)。表を読めなければ空 */
  pilotStages: string[];
  error: string | null;
}

/** 段階名の列 (見出しが「段階」の表の 1 列目)。表が無い・列が変わったら空にして、段階を「未記録」と出させる */
function readPilotStages(doc: string): string[] {
  const table = mdTableAfter(doc, PILOT_STAGE_SECTION);
  return table?.header[0] === "段階" ? table.rows.map((row) => row[0] ?? "") : [];
}

function readInputs(pilotStages: string[]): GateInputs {
  const interviews = wrap(() => readJson(ADMIN_STAT_INTERVIEWS_PATH));
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
    adminStatPilot: adminStatPilotProgress(hasError(interviews) ? null : interviews, pilotStages),
  };
}

export function strategyGateBoard(): StrategyGateBoard {
  try {
    const doc = readText(GATE_TABLE_DOC);
    const rows = gateRowsFromTable(mdTableAfter(doc, GATE_SECTION));
    const pilotStages = readPilotStages(doc);
    return { source: GATE_TABLE_DOC, pilotStages, ...buildGateBoard(rows, readInputs(pilotStages)), error: null };
  } catch (e) {
    return { source: GATE_TABLE_DOC, pilotStages: [], rows: [], issues: [], error: e instanceof Error ? e.message : String(e) };
  }
}
