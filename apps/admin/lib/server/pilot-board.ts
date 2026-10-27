import "server-only";

import fs from "node:fs";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import {
  buildPilotBoard,
  type ExperimentRecord,
  type NavClickSnapshot,
  type NoteDashboard,
  type PilotRow,
  type PilotSpec,
  type SalesObservation,
} from "../pilot-board";
import { fileExists, readCsv, readJson, statePath } from "./state-io";
import { jstDateStr } from "./time";
import { todoBoard } from "./todo";

/**
 * 収益化 pilot の判定ボードの入力を週次の記録から読む (置き場は config/datasets.mjs の台帳で引く)。**読み取り専用**。判定は lib/pilot-board.ts。
 * 記録が無いファイルは null にして、画面では「判定不能」と出す (0 に読み替えない)。
 */

export const PILOT_BOARD_PATH = datasetPath("business.pilot-board");
const GA4_SNAPSHOTS = datasetDir("ga4.snapshots");

interface GaSummary {
  jpFinalized7d?: { periodEnd?: string };
}

function readNavClicks(): NavClickSnapshot[] {
  if (!fileExists(GA4_SNAPSHOTS)) return [];
  return fs
    .readdirSync(statePath(GA4_SNAPSHOTS))
    .filter((week) => /^\d{4}-W\d{2}$/.test(week) && fileExists(`${GA4_SNAPSHOTS}/${week}/summary.json`))
    .flatMap((week): NavClickSnapshot[] => {
      const periodEnd = readJson<GaSummary>(`${GA4_SNAPSHOTS}/${week}/summary.json`).jpFinalized7d?.periodEnd;
      if (!periodEnd) return [];
      const csv = `${GA4_SNAPSHOTS}/${week}/nav-click-surfaces.csv`;
      const rows = fileExists(csv)
        ? readCsv(csv).map((r) => ({ surface: String(r.nav_surface), count: Number(r.eventCount) || 0 }))
        : null;
      return [{ weekId: week, periodEnd, rows }];
    });
}

function readOptional<T>(rel: string): T | null {
  return fileExists(rel) ? readJson<T>(rel) : null;
}

export interface PilotBoardView {
  today: string;
  rows: PilotRow[];
  error: string | null;
}

export function pilotBoard(): PilotBoardView {
  const today = jstDateStr();
  try {
    const { pilots } = readJson<{ pilots: PilotSpec[] }>(PILOT_BOARD_PATH);
    const sales = readOptional<{ observations: SalesObservation[] }>(datasetPath("sales.ledger"));
    const experiments = readOptional<{ experiments: ExperimentRecord[] }>(datasetPath("business.experiments"));
    const improvementDue = Object.fromEntries(todoBoard().improvements.map((r) => [r.id, r.due]));
    const rows = buildPilotBoard(pilots, {
      today,
      navClicks: readNavClicks(),
      sales: sales?.observations ?? null,
      note: readOptional<NoteDashboard>(`${datasetDir("note.dashboard")}/latest.json`),
      experiments: experiments?.experiments ?? [],
      improvementDue,
    });
    return { today, rows, error: null };
  } catch (e) {
    return { today, rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}
