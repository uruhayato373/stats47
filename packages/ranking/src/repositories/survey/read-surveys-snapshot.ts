import "server-only";

import type { Source } from "../../types/snapshot";
import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  SURVEYS_SNAPSHOT_KEY,
  type SurveysSnapshot,
} from "../../types/snapshot";

const loadAll = createSnapshotReader<SurveysSnapshot, Source[]>({
  key: SURVEYS_SNAPSHOT_KEY,
  label: "surveys",
  select: (snapshot) => snapshot.surveys,
  fallback: [],
});

export async function readSurveysFromR2(): Promise<Result<Source[], Error>> {
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
  try {
    const all = await loadAll();
    return ok(all.find((s) => s.id === surveyId) ?? null);
  } catch (error) {
    logger.error({ error, surveyId }, "readSurveyByIdFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
