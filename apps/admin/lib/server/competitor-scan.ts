import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import { buildCompetitorView, parseCompetitorScan, type CompetitorFilter, type CompetitorView } from "../competitor-scan";
import { readText } from "./state-io";

/**
 * 競合の観測の CSV を読む (置き場は config/datasets.mjs の台帳 id で引く)。**読み取り専用**。集計は lib/competitor-scan.ts。
 * CSV が無い・列が欠けたときは画面を落とさず、理由を error に入れて返す。
 */

export const COMPETITOR_SCAN_PATH = datasetPath("products.competitor-scan");
/** 表と読み取り (§2.2「販売されている競合」) がある文書 */
export const COMPETITOR_SCAN_DOC = "docs/00_プロジェクト管理/02_収益化戦略.md";

export function competitorScan(filter: CompetitorFilter): { view: CompetitorView | null; error: string | null } {
  try {
    return { view: buildCompetitorView(parseCompetitorScan(readText(COMPETITOR_SCAN_PATH)), filter), error: null };
  } catch (e) {
    return { view: null, error: e instanceof Error ? e.message : String(e) };
  }
}
