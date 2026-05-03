import "server-only";

import { getDrizzle, surveys } from "@stats47/database/server";
import { saveJsonSnapshot } from "@stats47/r2-storage/server";
import { asc } from "drizzle-orm";

import {
  SURVEYS_SNAPSHOT_KEY,
  type SurveysSnapshot,
} from "../types/snapshot";

import type { JsonSnapshotResult } from "@stats47/r2-storage/server";

export type ExportSurveysSnapshotResult = JsonSnapshotResult;

export async function exportSurveysSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportSurveysSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select()
    .from(surveys)
    .orderBy(asc(surveys.displayOrder));

  const snapshot: SurveysSnapshot = {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    surveys: rows,
  };

  return saveJsonSnapshot({
    key: SURVEYS_SNAPSHOT_KEY,
    data: snapshot,
    count: rows.length,
    label: "surveys",
    startedAt,
  });
}
