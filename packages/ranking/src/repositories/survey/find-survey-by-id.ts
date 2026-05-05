import "server-only";

import { getDrizzle, sources } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { eq, and } from "drizzle-orm";
import type { Source } from "@stats47/database/server";

export async function findSurveyById(
  surveyId: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Source | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(sources)
      .where(and(eq(sources.id, surveyId), eq(sources.sourceKind, "survey")))
      .limit(1);

    return ok(rows[0] ?? null);
  } catch (error) {
    logger.error({ surveyId, error }, "findSurveyById: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
