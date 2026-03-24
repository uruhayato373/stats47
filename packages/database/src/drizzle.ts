import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

import { getStaticDatabase } from "./core";

export function createDrizzleClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DrizzleClient = ReturnType<typeof createDrizzleClient>;

/**
 * Get a Drizzle client for the static database.
 */
export function getDrizzle(): DrizzleClient {
  const db = getStaticDatabase();
  return createDrizzleClient(db);
}
