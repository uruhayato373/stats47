import "server-only";

import { getDrizzle, sources } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { asc, eq } from "drizzle-orm";
import type { Source } from "@stats47/database/server";

export async function listSurveys(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Source[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(sources)
      .where(eq(sources.sourceKind, "survey"))
      .orderBy(asc(sources.displayOrder));

    return ok(rows);
  } catch (error) {
    logger.error({ error }, "listSurveys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
