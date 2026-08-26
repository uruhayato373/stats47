import "server-only";

import type { Source } from "../../types/snapshot";
import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  SURVEYS_SNAPSHOT_KEY,
  parseSurveysSnapshot,
  type SurveysSnapshot,
} from "../../types/snapshot";

const loadAll = createSnapshotReader<SurveysSnapshot, Source[]>({
  key: SURVEYS_SNAPSHOT_KEY,
  label: "surveys",
  parse: parseSurveysSnapshot,
  select: (snapshot) => snapshot.surveys,
  fallback: [],
});

function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export async function readSurveysFromR2(): Promise<Result<Source[], Error>> {
  if (isNextProductionBuild()) {
    return ok([]);
  }

  try {
    return ok(await loadAll());
  } catch (error) {
    logger.error({ error }, "readSurveysFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readSurveyByIdFromR2(
  surveyId: string,
): Promise<Result<Source | null, Error>> {
  if (isNextProductionBuild()) {
    return ok(null);
  }

  try {
    const all = await loadAll();
    return ok(all.find((s) => s.id === surveyId) ?? null);
  } catch (error) {
    logger.error({ error, surveyId }, "readSurveyByIdFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
