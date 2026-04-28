import "server-only";

import type { Survey } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  SURVEYS_SNAPSHOT_KEY,
  type SurveysSnapshot,
} from "../../types/snapshot";

const STALE_AFTER_DAYS = 30;

let cached: { fetchedAt: number; surveys: Survey[] } | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `surveys snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadAll(): Promise<Survey[]> {
  if (cached) return cached.surveys;
  const snapshot = await fetchFromR2AsJson<SurveysSnapshot>(
    SURVEYS_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: SURVEYS_SNAPSHOT_KEY },
      "surveys snapshot が R2 に存在しません",
    );
    cached = { fetchedAt: Date.now(), surveys: [] };
    return [];
  }
  warnIfStale(snapshot.generatedAt);
  cached = { fetchedAt: Date.now(), surveys: snapshot.surveys };
  return snapshot.surveys;
}

export async function readSurveysFromR2(): Promise<Result<Survey[], Error>> {
  try {
    return ok(await loadAll());
  } catch (error) {
    logger.error({ error }, "readSurveysFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readSurveyByIdFromR2(
  surveyId: string,
): Promise<Result<Survey | null, Error>> {
  try {
    const all = await loadAll();
    return ok(all.find((s) => s.id === surveyId) ?? null);
  } catch (error) {
    logger.error({ error, surveyId }, "readSurveyByIdFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
