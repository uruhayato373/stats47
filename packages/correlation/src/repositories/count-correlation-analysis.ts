import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
} from "@stats47/database/server";
import { count, sql } from "drizzle-orm";

/**
 * 相関分析結果の件数を取得する
 */
export async function countCorrelationAnalysis(): Promise<number> {
  const db = getDrizzle();
  const result = await db
    .select({ count: count() })
    .from(correlationAnalysis);
  return result[0]?.count ?? 0;
}

/**
 * 強い相関（|pearson_r| >= 0.7）の件数を取得する
 */
export async function countStrongCorrelations(): Promise<number> {
  const db = getDrizzle();
  const result = await db
    .select({ count: count() })
    .from(correlationAnalysis)
    .where(sql`ABS(${correlationAnalysis.pearsonR}) >= 0.7`);
  return result[0]?.count ?? 0;
}
