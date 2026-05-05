import "server-only";

import { getDrizzle, sources } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { asc, eq } from "drizzle-orm";

import {
  SURVEYS_SNAPSHOT_KEY,
  type SurveysSnapshot,
} from "../types/snapshot";

export interface ExportSurveysSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

export async function exportSurveysSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportSurveysSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select()
    .from(sources)
    .where(eq(sources.sourceKind, "survey"))
    .orderBy(asc(sources.displayOrder));

  const snapshot: SurveysSnapshot = {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    surveys: rows,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(SURVEYS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      key: result.key,
      count: rows.length,
      sizeBytes: result.size,
      durationMs,
    },
    "surveys snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    count: rows.length,
    sizeBytes: result.size,
    durationMs,
  };
}
