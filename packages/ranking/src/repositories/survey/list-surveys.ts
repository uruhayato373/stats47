import "server-only";

import { getDrizzle, surveys } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { asc } from "drizzle-orm";
import type { Survey } from "@stats47/database/server";

export async function listSurveys(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Survey[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(surveys)
      .orderBy(asc(surveys.displayOrder));

    return ok(rows);
  } catch (error) {
    logger.error({ error }, "listSurveys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
