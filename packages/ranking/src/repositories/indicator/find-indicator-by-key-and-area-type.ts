import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

import type { Indicator } from "@stats47/database/server";

/**
 * indicators を (key, area_type) で取得する並行 reader (PR-3)
 *
 * 旧 findRankingItemByKeyAndAreaType の置換候補。PR-5 で呼び出し側を切替。
 */
export async function findIndicatorByKeyAndAreaType(
  key: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Indicator | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(indicators)
      .where(and(eq(indicators.key, key), eq(indicators.areaType, areaType)))
      .limit(1);

    return ok(rows[0] ?? null);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
