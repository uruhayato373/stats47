import "server-only";

import { areaProfiles, getDrizzle } from "@stats47/database/server";
import { sql } from "drizzle-orm";

/**
 * area_profiles の総レコード数 (PR-5)
 */
export async function getAreaProfileCount(): Promise<number> {
  const db = getDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(areaProfiles)
    .get();
  return result?.count ?? 0;
}
